import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ADMIN_TOKEN;

    if (!domain || !token) {
      console.error("Missing Shopify Admin API credentials");
      return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
    }

    // We use Shopify's ultra-fast GraphQL API to search for the customer by phone 
    // and instantly pull their last 5 orders in a single request.
    const query = `
      query getCustomerByPhone($query: String!) {
        customers(first: 1, query: $query) {
          edges {
            node {
              id
              firstName
              lastName
              email
              amountSpent {
                amount
                currencyCode
              }
              orders(first: 5, sortKey: CREATED_AT, reverse: true) {
                edges {
                  node {
                    id
                    name
                    createdAt
                    displayFinancialStatus
                    displayFulfillmentStatus
                    totalPriceSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    // Format the phone number to maximize search success (removes spaces/pluses if needed, though Shopify handles standard formats well)
    const searchQuery = `phone:${phone}`;

    const response = await fetch(`https://${domain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        query,
        variables: { query: searchQuery },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error("Shopify GraphQL Error:", data.errors);
      return NextResponse.json({ error: 'Failed to fetch from Shopify' }, { status: 500 });
    }

    const customerNode = data.data.customers.edges[0]?.node;

    if (!customerNode) {
      return NextResponse.json({ found: false, message: 'No customer found with this phone number.' });
    }

    // Format the data beautifully for our dashboard UI
    const formattedData = {
      found: true,
      firstName: customerNode.firstName,
      lastName: customerNode.lastName,
      email: customerNode.email,
      totalSpent: `${customerNode.amountSpent.currencyCode} ${customerNode.amountSpent.amount}`,
      recentOrders: customerNode.orders.edges.map((edge: any) => ({
        orderName: edge.node.name,
        date: new Date(edge.node.createdAt).toLocaleDateString(),
        paymentStatus: edge.node.displayFinancialStatus,
        fulfillmentStatus: edge.node.displayFulfillmentStatus,
        total: `${edge.node.totalPriceSet.shopMoney.currencyCode} ${edge.node.totalPriceSet.shopMoney.amount}`,
      })),
    };

    return NextResponse.json(formattedData, { status: 200 });

  } catch (error: any) {
    console.error('Shopify API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}