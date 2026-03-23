import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const N8N_URL = process.env.N8N_URL || 'https://productverse.up.railway.app';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

async function n8nRequest(method, path, body) {
  const res = await fetch(`${N8N_URL}/api/v1${path}`, {
    method,
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

const server = new Server(
  { name: 'marqq-n8n', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_workflows',
      description: 'List all n8n workflows',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_workflow',
      description: 'Get workflow by ID',
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: { type: 'string', description: 'The workflow ID' },
        },
        required: ['workflowId'],
      },
    },
    {
      name: 'create_workflow',
      description: 'Create a new n8n workflow. nodes and connections must be JSON strings.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Workflow name' },
          nodes: { type: 'string', description: 'JSON array of node objects' },
          connections: { type: 'string', description: 'JSON object of connections' },
          settings: { type: 'string', description: 'Optional JSON settings object' },
        },
        required: ['name', 'nodes', 'connections'],
      },
    },
    {
      name: 'activate_workflow',
      description: 'Activate a workflow',
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: { type: 'string', description: 'The workflow ID' },
        },
        required: ['workflowId'],
      },
    },
    {
      name: 'deactivate_workflow',
      description: 'Deactivate a workflow',
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: { type: 'string', description: 'The workflow ID' },
        },
        required: ['workflowId'],
      },
    },
    {
      name: 'delete_workflow',
      description: 'Delete a workflow',
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: { type: 'string', description: 'The workflow ID' },
        },
        required: ['workflowId'],
      },
    },
    {
      name: 'execute_workflow',
      description: 'Execute a workflow manually',
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: { type: 'string', description: 'The workflow ID' },
          data: { type: 'string', description: 'Optional JSON input data' },
        },
        required: ['workflowId'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
  const errResponse = (e) => ({ content: [{ type: 'text', text: JSON.stringify({ error: e.message }) }] });

  if (!N8N_API_KEY) {
    return ok({ error: 'N8N_API_KEY not configured. Add it to ~/.claude/settings.json mcpServers.marqq-n8n.env.N8N_API_KEY' });
  }

  try {
    switch (name) {
      case 'list_workflows': {
        const data = await n8nRequest('GET', '/workflows');
        const items = Array.isArray(data) ? data : (data.data || []);
        return ok(items.map(w => ({ id: w.id, name: w.name, active: w.active, updatedAt: w.updatedAt })));
      }

      case 'get_workflow': {
        const data = await n8nRequest('GET', `/workflows/${args.workflowId}`);
        return ok(data);
      }

      case 'create_workflow': {
        const nodes = JSON.parse(args.nodes);
        const connections = JSON.parse(args.connections);
        const settings = args.settings ? JSON.parse(args.settings) : {};

        const payload = {
          name: args.name,
          nodes,
          connections,
          settings,
        };

        const data = await n8nRequest('POST', '/workflows', payload);

        // Extract webhook URL from any webhook node
        const webhookNode = nodes.find((node) => node.type === 'n8n-nodes-base.webhook');
        const webhookPath = webhookNode?.parameters?.path;
        const webhookUrl = webhookPath ? `${N8N_URL}/webhook/${webhookPath}` : null;

        return ok({
          id: data.id,
          name: data.name,
          active: data.active,
          webhookUrl,
        });
      }

      case 'activate_workflow': {
        const data = await n8nRequest('POST', `/workflows/${args.workflowId}/activate`);
        return ok(data);
      }

      case 'deactivate_workflow': {
        const data = await n8nRequest('POST', `/workflows/${args.workflowId}/deactivate`);
        return ok(data);
      }

      case 'delete_workflow': {
        const data = await n8nRequest('DELETE', `/workflows/${args.workflowId}`);
        return ok(data);
      }

      case 'execute_workflow': {
        const body = args.data ? { data: JSON.parse(args.data) } : {};
        const data = await n8nRequest('POST', `/workflows/${args.workflowId}/run`, body);
        return ok(data);
      }

      default:
        return ok({ error: `Unknown tool: ${name}` });
    }
  } catch (e) {
    return errResponse(e);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
