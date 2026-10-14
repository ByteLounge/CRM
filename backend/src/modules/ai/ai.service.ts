import axios from 'axios';
import { env } from '../../config/env';
import { repo } from '../../repositories/database.repository';
import { Customer, Order } from '../../types/models';
import { logger } from '../../utils/logger';
import {
  customerInsightsResponseSchema,
  generateCommunicationResponseSchema,
  retentionOpportunitySchema,
} from './ai.schema';

export class FlowAIService {
  private calculateDaysSince(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  // =========================================================================
  // Capability A: Grounded Customer Behavioral Summary & Insights
  // =========================================================================
  async generateCustomerInsights(orgId: string, customerId: string) {
    const customer = await repo.getCustomerById(orgId, customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const ordersResult = await repo.listOrders(orgId, { customerId, limit: 10, sortBy: 'placed_at', sortOrder: 'desc' });
    const orders = ordersResult.orders;

    const daysSinceLastOrder = this.calculateDaysSince(customer.last_order_at);
    const aov = customer.total_orders > 0 ? customer.total_spent / customer.total_orders : 0;

    let churnRisk: 'low' | 'medium' | 'high' = 'low';
    let churnReason = 'Customer engages regularly.';
    let recommendedAction = 'Maintain standard nurturing communication.';

    if (daysSinceLastOrder === null) {
      churnRisk = 'medium';
      churnReason = 'Customer has registered or was imported but has placed 0 completed orders.';
      recommendedAction = 'Send an introductory onboarding welcome email with a first-order incentive.';
    } else if (daysSinceLastOrder > 60) {
      churnRisk = 'high';
      churnReason = `Customer has not placed an order in ${daysSinceLastOrder} days, exceeding the normal 60-day active threshold.`;
      recommendedAction = 'Dispatch a targeted VIP re-engagement message with tailored product recommendations.';
    } else if (daysSinceLastOrder > 30) {
      churnRisk = 'medium';
      churnReason = `Customer last purchased ${daysSinceLastOrder} days ago. Approaching typical re-order cycle.`;
      recommendedAction = 'Check in on their experience with recent purchases to keep the relationship warm.';
    } else {
      churnRisk = 'low';
      churnReason = `Customer purchased recently (${daysSinceLastOrder} days ago).`;
      recommendedAction = customer.total_spent > 500
        ? 'Acknowledge VIP status and offer sneak peeks at upcoming catalog releases.'
        : 'Deliver prompt order fulfillment updates and post-purchase follow-up.';
    }

    // Try Gemini LLM if key is configured
    if (env.GEMINI_API_KEY) {
      try {
        const prompt = `
You are FlowAI, an expert CRM customer intelligence analyst.
Analyze the following customer metrics grounded STRICTLY in the provided data:
- Name: ${customer.first_name} ${customer.last_name}
- Email: ${customer.email}
- Total Orders: ${customer.total_orders}
- Total Spent: $${customer.total_spent}
- Average Order Value: $${aov.toFixed(2)}
- Days Since Last Purchase: ${daysSinceLastOrder ?? 'Never'}
- Segment: ${customer.segment}
- Recent Orders: ${JSON.stringify(orders.map((o) => ({ number: o.order_number, total: o.total_amount, status: o.status, date: o.placed_at })))}

Respond with a JSON object with this exact structure:
{
  "summary": "Concise 2-sentence summary grounded in data",
  "churnRisk": "low" | "medium" | "high",
  "churnReason": "Specific evidence for the churn risk assessment",
  "recommendedAction": "Actionable operator recommendation"
}
`;
        const res = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          },
          { timeout: 8000 }
        );

        const content = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          const parsedJson = JSON.parse(content);
          return customerInsightsResponseSchema.parse({
            summary: parsedJson.summary,
            churnRisk: parsedJson.churnRisk,
            churnReason: parsedJson.churnReason,
            recommendedAction: parsedJson.recommendedAction,
            keyMetrics: {
              totalOrders: customer.total_orders,
              totalSpent: customer.total_spent,
              averageOrderValue: Math.round(aov * 100) / 100,
              daysSinceLastOrder,
              segment: customer.segment,
            },
          });
        }
      } catch (err: any) {
        logger.warn(`Gemini API call failed, falling back to deterministic intelligence: ${err.message}`);
      }
    }

    // Grounded deterministic fallback
    const summary = `${customer.first_name || 'Customer'} has completed ${customer.total_orders} order${
      customer.total_orders === 1 ? '' : 's'
    } for a lifetime value of $${customer.total_spent.toFixed(2)}${
      daysSinceLastOrder !== null
        ? `, with their last order placed ${daysSinceLastOrder} days ago.`
        : ' with no recorded completed purchases.'
    }`;

    return customerInsightsResponseSchema.parse({
      summary,
      churnRisk,
      churnReason,
      recommendedAction,
      keyMetrics: {
        totalOrders: customer.total_orders,
        totalSpent: customer.total_spent,
        averageOrderValue: Math.round(aov * 100) / 100,
        daysSinceLastOrder,
        segment: customer.segment,
      },
    });
  }

  // =========================================================================
  // Capability B: Grounded Personalized Communication Draft Generator
  // =========================================================================
  async generatePersonalizedCommunication(
    orgId: string,
    params: {
      customerId: string;
      orderId?: string | null;
      purpose: string;
      channel: string;
      tone: string;
      additionalInstructions?: string;
    }
  ) {
    const customer = await repo.getCustomerById(orgId, params.customerId);
    if (!customer) {
      throw new Error(`Customer ${params.customerId} not found`);
    }

    let order: Order | null = null;
    if (params.orderId) {
      order = await repo.getOrderById(orgId, params.orderId);
    } else {
      const recentOrders = await repo.listOrders(orgId, { customerId: customer.id, limit: 1 });
      order = recentOrders.orders[0] || null;
    }

    const customerName = `${customer.first_name} ${customer.last_name}`.trim() || 'Valued Customer';
    const storeName = 'FlowCRM Store';

    if (env.GEMINI_API_KEY) {
      try {
        const prompt = `
You are FlowAI, generating a personalized CRM communication draft.
Customer:
- Name: ${customerName}
- Total Orders: ${customer.total_orders}
- Lifetime Spend: $${customer.total_spent}
- Segment: ${customer.segment}
- Associated Order: ${order ? `#${order.order_number} (${order.status}, $${order.total_amount})` : 'None'}
- Purpose: ${params.purpose}
- Tone: ${params.tone}
- Additional Guidance: ${params.additionalInstructions || 'None'}

Generate a professional draft in JSON format:
{
  "subject": "Clear, compelling email subject line",
  "message": "Polite, personalized message body formatted with line breaks",
  "suggestedAction": "Brief next step for the operator",
  "confidenceScore": 0.95
}
`;
        const res = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          },
          { timeout: 8000 }
        );

        const content = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          const parsedJson = JSON.parse(content);
          return generateCommunicationResponseSchema.parse({
            subject: parsedJson.subject,
            message: parsedJson.message,
            suggestedAction: parsedJson.suggestedAction,
            confidenceScore: Number(parsedJson.confidenceScore || 0.95),
          });
        }
      } catch (err: any) {
        logger.warn(`Gemini communication draft generation failed, using structured template: ${err.message}`);
      }
    }

    // Deterministic high-quality contextual templates
    let subject = '';
    let message = '';
    let suggestedAction = '';

    switch (params.purpose) {
      case 'order_followup':
        subject = `Following up on your recent order ${order ? `#${order.order_number}` : ''}`;
        message = `Hi ${customerName},\n\nWe wanted to reach out and check in on your recent purchase ${
          order ? `(Order #${order.order_number})` : ''
        }. We hope everything arrived in perfect condition and meets your expectations.\n\nIf you have any questions or require any assistance, please let us know—we're here to help!\n\nBest regards,\nThe ${storeName} Team`;
        suggestedAction = 'Send follow-up 3-5 days after delivery.';
        break;

      case 'thank_you':
        subject = `Thank you for your purchase, ${customer.first_name || 'friend'}!`;
        message = `Dear ${customerName},\n\nThank you so much for your recent order! Customers like you make everything we do worthwhile.\n\nAs a token of our appreciation for your support, keep an eye out for our exclusive upcoming member rewards.\n\nWarm regards,\nThe ${storeName} Team`;
        suggestedAction = 'Send promptly upon successful payment confirmation.';
        break;

      case 'customer_reengagement':
        subject = `We've missed you at ${storeName}, ${customer.first_name || ''}`;
        message = `Hello ${customerName},\n\nIt's been a while since we last saw you! We've recently added several exciting new products to our collection that we think you'll love.\n\nTo welcome you back, use code WELCOMEBACK15 for 15% off your next order.\n\nWarmly,\nThe ${storeName} Team`;
        suggestedAction = 'Review draft and approve for inactive customer re-engagement.';
        break;

      case 'support_response':
        subject = `Update regarding your inquiry — ${storeName}`;
        message = `Hello ${customerName},\n\nThank you for reaching out to us. We are actively reviewing your request and want to ensure you have a seamless experience with us.\n\nCould you please let us know if there are any additional details we can assist you with?\n\nSincerely,\nCustomer Support Team`;
        suggestedAction = 'Review customer inquiry before dispatching.';
        break;

      default:
        subject = `A quick note from ${storeName}`;
        message = `Hello ${customerName},\n\nWe appreciate having you as part of our community. Please let us know if there is anything we can do to assist your shopping experience.\n\nBest regards,\nThe ${storeName} Team`;
        suggestedAction = 'Review general communication draft.';
    }

    return generateCommunicationResponseSchema.parse({
      subject,
      message,
      suggestedAction,
      confidenceScore: 0.92,
    });
  }

  // =========================================================================
  // Capability C: Autonomous Customer Retention Agent
  // =========================================================================
  async runRetentionAgentScan(orgId: string) {
    const { customers } = await repo.listCustomers(orgId, { limit: 100 });
    const opportunities: any[] = [];

    for (const cust of customers) {
      const daysInactive = this.calculateDaysSince(cust.last_order_at);

      // Flag customers who are inactive (> 45 days) or high value candidates
      if (daysInactive !== null && daysInactive >= 40) {
        let churnRisk: 'high' | 'medium' | 'low' = 'medium';
        if (daysInactive >= 60 || cust.total_spent > 300) {
          churnRisk = 'high';
        }

        const diagnosis = `Customer has completed ${cust.total_orders} orders ($${cust.total_spent.toFixed(
          2
        )} LTV) but has been inactive for ${daysInactive} days.`;

        const suggestedOffer =
          cust.total_spent > 500
            ? 'VIP Exclusive 20% Retention Credit + Personal Concierge Note'
            : '15% Reactivation Voucher (Code: COMEBACK15)';

        const draftSubject = `We've missed you, ${cust.first_name || 'valued customer'} — here is a special gift`;
        const draftMessage = `Hi ${cust.first_name || 'there'},\n\nWe noticed it has been over a month since your last order with us. We value your business tremendously and would love to welcome you back.\n\nEnjoy ${suggestedOffer} on your next visit.\n\nWarmly,\nYour Customer Care Team`;

        opportunities.push({
          customerId: cust.id,
          customerName: `${cust.first_name} ${cust.last_name}`.trim() || 'Customer',
          customerEmail: cust.email,
          segment: cust.segment,
          totalSpent: cust.total_spent,
          daysInactive,
          churnRisk,
          diagnosis,
          suggestedOffer,
          draftSubject,
          draftMessage,
        });
      }
    }

    // Sort opportunities by highest value & churn risk
    opportunities.sort((a, b) => b.totalSpent - a.totalSpent);

    return {
      totalScanned: customers.length,
      opportunitiesFound: opportunities.length,
      opportunities: opportunities.slice(0, 10).map((o) => retentionOpportunitySchema.parse(o)),
    };
  }
}

export const flowAIService = new FlowAIService();
