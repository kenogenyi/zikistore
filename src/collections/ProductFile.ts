import { User } from '../payload-types'
import { BeforeChangeHook } from 'payload/dist/collections/config/types'
import { Access, CollectionConfig } from 'payload/types'

const addUser: BeforeChangeHook = ({ req, data }) => {
  const user = req.user as User | null
  return { ...data, user: user?.id }
}

const yourOwnAndPurchased: Access = async ({ req }) => {
  const user = req.user as User | null

  if (user?.role === 'admin') return true
  if (!user) return false

  const { docs: products } = await req.payload.find({
    collection: 'products',
    depth: 0,
    where: {
      user: {
        equals: user.id,
      },
    },
  })

  const ownProductFileIds = products
    .map((prod) => prod.product_files)
    .flat()

  const { docs: orders } = await req.payload.find({
    collection: 'orders',
    depth: 2,
    where: {
      user: {
        equals: user.id,
      },
    },
  })

  type Order = {
  products: (string | { product_files: string | { id: string } })[];
};

const ordersResponse = await req.payload.find({
  collection: 'orders',
  depth: 2,
  where: {
    user: {
      equals: user.id,
    },
  },
});

const purchasedProductFileIds = ordersResponse.docs
  .map((order: any) =>
    (order.products || []).map((product: any) => {
      if (typeof product === 'string') {
        req.payload.logger.error('Search depth not sufficient to find purchased file IDs');
        return null;
      }

      const productFile = product.product_files;

      return typeof productFile === 'string'
        ? productFile
        : productFile?.id;
    })
  )
  .flat()
  .filter(Boolean);


  return {
    id: {
      in: [
        ...ownProductFileIds,
        ...purchasedProductFileIds,
      ],
    },
  }
}

export const ProductFiles: CollectionConfig = {
  slug: 'product_files',
  admin: {
    hidden: ({ user }) => user.role !== 'admin',
  },
  hooks: {
    beforeChange: [addUser],
  },
  access: {
    read: yourOwnAndPurchased,
    update: ({ req }) => req.user.role === 'admin',
    delete: ({ req }) => req.user.role === 'admin',
  },
  upload: {
    staticURL: '/product_files',
    staticDir: 'product_files',
    mimeTypes: [
      'image/*',
      'font/*',
      'application/postscript',
    ],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        condition: () => false,
      },
      hasMany: false,
      required: true,
    },
  ],
}
