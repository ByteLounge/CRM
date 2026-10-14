import { createApp } from './app';
import { env } from './config/env';
import { wcService } from './modules/integrations/woocommerce/woocommerce.service';
import { repo } from './repositories/database.repository';
import { logger } from './utils/logger';

async function bootstrap() {
  const app = createApp();

  // Initialize default organization if not present
  const orgs = await repo.listOrganisations();
  let defaultOrgId = 'org_default_01';

  if (orgs.length === 0) {
    logger.info('Initializing default organization for FlowCRM...');
    const defaultOrg = await repo.createOrganisation('FlowCRM Flagship Store', defaultOrgId);
    defaultOrgId = defaultOrg.id;
    await repo.addOrganisationMember(defaultOrgId, 'user_demo_01', 'owner');
  } else {
    defaultOrgId = orgs[0].id;
  }

  // Pre-seed mock store sync if empty
  const customers = await repo.listCustomers(defaultOrgId, { limit: 1 });
  if (customers.total === 0) {
    logger.info(`Database empty. Performing initial WooCommerce synchronisation for org ${defaultOrgId}...`);
    await wcService.runFullSync(defaultOrgId);
  }

  app.listen(env.PORT, () => {
    logger.info(`🚀 FlowCRM Backend Server running on http://localhost:${env.PORT}`);
    logger.info(`⚙️  Environment: ${env.NODE_ENV} | Mock Integration Mode: ${env.WOOCOMMERCE_MOCK_MODE}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Fatal error during FlowCRM server startup:', err);
  process.exit(1);
});
