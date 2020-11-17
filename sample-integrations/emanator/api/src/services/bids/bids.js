import { db } from 'src/lib/db'

export const bids = () => {
  return db.bid.findMany()
}

export const Bid = {
  auction: (_obj, { root }) =>
    db.bid.findOne({ where: { id: root.id } }).auction(),
}
