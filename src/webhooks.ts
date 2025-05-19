import express from 'express'
import { WebhookRequest } from './server'
import axios from 'axios'
import { getPayloadClient } from './get-payload'
import { Product } from './payload-types'
import { Resend } from 'resend'
import { ReceiptEmailHtml } from './components/emails/ReceiptEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export const paystackWebhookHandler = async (
  req: express.Request,
  res: express.Response
) => {
  type PaystackEvent = {
  data: {
    metadata: {
      orderId: string;
      userId: string;
    };
  };
  event: string;
};

const event = req.body as PaystackEvent

  if (!event || !event.event) {
    return res.status(400).send('Invalid webhook data')
  }

  // Handle payment successful event
  if (event.event === 'charge.success') {
    const metadata = event.data.metadata

    if (!metadata?.userId || !metadata?.orderId) {
      return res
        .status(400)
        .send(`Webhook Error: No user or order in metadata`)
    }

    const payload = await getPayloadClient()

    const { docs: users } = await payload.find({
      collection: 'users',
      where: {
        id: {
          equals: metadata.userId,
        },
      },
    })

    const [user] = users

    if (!user) {
      return res.status(404).json({ error: 'No such user exists.' })
    }

    const { docs: orders } = await payload.find({
      collection: 'orders',
      depth: 2,
      where: {
        id: {
          equals: metadata.orderId,
        },
      },
    })

    const [order] = orders

    if (!order) {
      return res.status(404).json({ error: 'No such order exists.' })
    }

    await payload.update({
      collection: 'orders',
      data: {
        _isPaid: true,
      },
      where: {
        id: {
          equals: metadata.orderId,
        },
      },
    })

    // Send receipt
    try {const data = await resend.emails.send({
  from: 'zikistore support <ogenyiken@gmail.com>',
  to: [user.email as string],
  subject: 'Thanks for your order! This is your receipt.',
  html: ReceiptEmailHtml({
    date: new Date(),
    email: user.email as string,
    orderId: metadata.orderId as string,
    products: (order?.products ?? []) as Product[],
  }),
      })
      res.status(200).json({ data })
    } catch (error) {
      res.status(500).json({ error })
    }
  }

  return res.status(200).send()
}
