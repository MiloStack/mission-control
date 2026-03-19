export interface GatewayConfig {
  url: string;
  token: string;
  name?: string;
  connected?: boolean;
  lastConnected?: string;
}

const STORAGE_KEY = 'mission-control-gateway';

export function getGatewayConfig(): GatewayConfig | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveGatewayConfig(config: GatewayConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearGatewayConfig(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export async function testGatewayConnection(config: GatewayConfig): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Try the main API endpoint
    const response = await fetch(`${config.url}/api/status`, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: 'Connected successfully', data };
    }

    return { success: false, message: `Failed: ${response.status} ${response.statusText}` };
  } catch (error) {
    // Try health endpoint
    try {
      const healthResponse = await fetch(`${config.url}/health`, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
        },
      });

      if (healthResponse.ok) {
        return { success: true, message: 'Connected (health endpoint)' };
      }
    } catch {
      // Ignore
    }

    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Could not reach gateway' 
    };
  }
}
