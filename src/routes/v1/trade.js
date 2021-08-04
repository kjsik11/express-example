import { Router } from 'express';
import Joi from 'joi';
import request from 'request';
import { parseStringPromise } from 'xml2js';

import checkApiKey from '../../middlewares/check-api-key.js';

const router = Router();

const checkBodySchema = Joi.object({
  applicationNumber: Joi.number().label('applicationNumber').required(),
});

const accessKey = process.env.KIPRIS_ACCESS_KEY;
const adminKey = process.env.ADMIN_KEY;
const url = process.env.TRADEMARK_URL;

if (!accessKey) throw Error('No Such Api-key');
if (!adminKey) throw Error('No Such Admin-Key');
if (!url) throw Error('No Such url');

router.use('/', checkApiKey);

router.get('/', async (req, res) => {
  const { db } = req.app.locals;

  const data = await db.collection('trademark').find({}).limit(10).toArray();

  return res.json({ tradeMarkes: data.map((val) => val.tradeMarkInfo) });
});

router.post('/', async (req, res) => {
  const { applicationNumber } = await checkBodySchema
    .validateAsync(req.body)
    .catch((err) => res.status(400).json({ error: err.message }));

  // FIXME: 🤮 lol 🤮
  await request.get({ url, qs: { applicationNumber, accessKey } }, async (err, response) => {
    if (err) res.status(404).json({ error: 'trademark server error' });

    const {
      response: {
        body: { items },
      },
    } = await parseStringPromise(response.body, {
      explicitArray: false,
    });

    if (items.TotalSearchCount === '0') {
      res.status(404).send({ result: 'No such trademark item' });
    } else {
      const { db } = req.app.locals;

      const tradeMark = await db
        .collection('trademark')
        .findOne({ 'tradeMarkInfo.ApplicationNumber': String(applicationNumber), deleted: null });

      if (tradeMark) {
        res.status(304).json({ result: 'already exist applicationId' });
      } else {
        const { insertedId } = await db.collection('trademark').insertOne({
          tradeMarkInfo: items.TradeMarkInfo,
          createdAt: new Date(),
        });

        res.json({ insertedId });
      }
    }
  });
});

export default router;
