import { Router, Request, Response } from 'express';
import https from 'https';
import http from 'http';

type DiningStatus = 'open' | 'busy' | 'closed' | 'unknown';

interface DiningHallConfig {
  id: string;
  name: string;
  pageUrl: string;
  activityId: number;
}

interface DiningHallStatus {
  id: string;
  name: string;
  pageUrl: string;
  statusText?: string;
  statusDetail?: string;
  activityLevel?: number;
  status: DiningStatus;
  isOpen: boolean;
  lastUpdated: string;
  error?: string;
}

const router = Router();

const DINING_HALLS: DiningHallConfig[] = [
  {
    id: 'epicuria-ackerman',
    name: 'Epic at Ackerman',
    pageUrl: 'https://dining.ucla.edu/epicuria-at-ackerman/',
    activityId: 874,
  },
  {
    id: 'bruin-cafe',
    name: 'Bruin Café',
    pageUrl: 'https://dining.ucla.edu/bruin-cafe/',
    activityId: 867,
  },
  {
    id: 'rendezvous',
    name: 'Rendezvous',
    pageUrl: 'https://dining.ucla.edu/rendezvous/',
    activityId: 870,
  },
  {
    id: 'hedrick-study',
    name: 'The Study at Hedrick',
    pageUrl: 'https://dining.ucla.edu/the-study-at-hedrick/',
    activityId: 871,
  },
];

const ACTIVITY_BASE_URL =
  'https://dining.ucla.edu/wp-content/plugins/activity-meter/activity_ajax.php?location_id=';

const REQUEST_TIMEOUT = 10000;
const MAX_REDIRECTS = 3;

const fetchText = (url: string, redirectCount = 0): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const requester = parsedUrl.protocol === 'https:' ? https : http;

      const req = requester.request(
        {
          protocol: parsedUrl.protocol,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'GET',
          headers: {
            'User-Agent': 'BruinCoinDiningStatus/1.0',
            Accept: 'text/html,application/xhtml+xml',
          },
        },
        (res) => {
          if (
            res.statusCode &&
            [301, 302, 307, 308].includes(res.statusCode) &&
            res.headers.location &&
            redirectCount < MAX_REDIRECTS
          ) {
            res.resume();
            const redirectUrl = new URL(res.headers.location, parsedUrl).toString();
            fetchText(redirectUrl, redirectCount + 1)
              .then(resolve)
              .catch(reject);
            return;
          }

          if (!res.statusCode || res.statusCode >= 400) {
            res.resume();
            reject(new Error(`Request failed with status ${res.statusCode ?? 'unknown'}`));
            return;
          }

          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => resolve(data));
        },
      );

      req.on('error', reject);
      req.setTimeout(REQUEST_TIMEOUT, () => {
        req.destroy(new Error('Request timed out'));
      });
      req.end();
    } catch (error) {
      reject(error);
    }
  });
};

const decodeHtml = (input?: string): string | undefined => {
  if (!input) return undefined;
  return input
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&rsquo;|&#8217;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/gi, '"')
    .replace(/&#8211;|&ndash;/gi, '-')
    .replace(/&#8212;|&mdash;/gi, '-')
    .replace(/&hellip;|&#8230;/gi, '...')
    .replace(/<[^>]*>/g, '')
    .trim();
};

const extractStatusText = (html: string): string | undefined => {
  const match = html.match(/<span class="status-text[^>]*>([\s\S]*?)<\/span>/i);
  return decodeHtml(match ? match[1] : undefined);
};

const extractStatusDetail = (html: string): string | undefined => {
  const match = html.match(/<p class="dining-status">([\s\S]*?)<\/p>/i);
  return decodeHtml(match ? match[1] : undefined);
};

const extractActivityLevel = (html: string): number | undefined => {
  const match = html.match(/id="activity-level">\s*([\d.]+)%/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) ? Math.round(value) : undefined;
};

const deriveStatus = (statusText?: string, activityLevel?: number): DiningStatus => {
  if (!statusText) {
    return 'unknown';
  }

  const normalized = statusText.toLowerCase();
  if (normalized.includes('closed')) {
    return 'closed';
  }
  if (typeof activityLevel === 'number' && activityLevel >= 70) {
    return 'busy';
  }
  if (normalized.includes('open')) {
    return 'open';
  }
  return 'unknown';
};

const fetchDiningHallStatus = async (config: DiningHallConfig): Promise<DiningHallStatus> => {
  const base: DiningHallStatus = {
    id: config.id,
    name: config.name,
    pageUrl: config.pageUrl,
    status: 'unknown',
    isOpen: false,
    lastUpdated: new Date().toISOString(),
  };

  try {
    const [pageHtml, activityHtml] = await Promise.allSettled([
      fetchText(config.pageUrl),
      fetchText(`${ACTIVITY_BASE_URL}${config.activityId}`),
    ]);

    if (pageHtml.status === 'fulfilled') {
      base.statusText = extractStatusText(pageHtml.value);
      base.statusDetail = extractStatusDetail(pageHtml.value);
    }

    if (activityHtml.status === 'fulfilled') {
      base.activityLevel = extractActivityLevel(activityHtml.value);
    }

    base.status = deriveStatus(base.statusText, base.activityLevel);
    base.isOpen = base.status === 'open' || base.status === 'busy';

    if (pageHtml.status === 'rejected' || activityHtml.status === 'rejected') {
      const messages = [];
      if (pageHtml.status === 'rejected') {
        messages.push('page');
      }
      if (activityHtml.status === 'rejected') {
        messages.push('activity');
      }
      base.error = `Failed to load ${messages.join(' & ')} data`;
    }
  } catch (error) {
    base.status = 'unknown';
    base.isOpen = false;
    base.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return base;
};

router.get('/status', async (_req: Request, res: Response) => {
  try {
    const statuses = await Promise.all(DINING_HALLS.map((hall) => fetchDiningHallStatus(hall)));
    res.json({
      halls: statuses,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load dining status',
    });
  }
});

export default router;
