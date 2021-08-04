import { Router } from 'express';
import Joi from 'joi';
import request from 'request';
import { parseStringPromise } from 'xml2js';

const router = Router();

const checkBodySchema = Joi.object({
  applicationNumber: Joi.number().label('applicationNumber').required(),
});
const checkApiKeySchema = Joi.string().label('apiKey').required();

const accessKey = process.env.KIPRIS_ACCESS_KEY;
const adminKey = process.env.ADMIN_KEY;
const url = process.env.TRADEMARK_URL;

if (!accessKey) throw Error('No Such Api-key');

if (!adminKey) throw Error('No Such Admin-Key');

if (!url) throw Error('No Such url');

router.get('/', async (req, res) => {
  const apiKey = await checkApiKeySchema
    .validateAsync(req.headers.authorization)
    .catch((err) => res.status(400).json({ error: err.message }));

  if (apiKey !== adminKey) {
    res.status(401).end();
  }

  const { db } = req.app.locals;

  const data = await db
    .collection('trademark')
    .find({
      deletedAT: null,
    })
    .toArray();

  res.json({ tradeMarkes: data.map((val) => val.tradeMarkInfo) });
});

router.post('/', async (req, res) => {
  const { applicationNumber } = await checkBodySchema
    .validateAsync(req.body)
    .catch((err) => res.status(400).json({ error: err.message }));

  const apiKey = await checkApiKeySchema
    .validateAsync(req.headers.authorization)
    .catch((err) => res.status(400).json({ error: err.message }));

  if (apiKey !== adminKey) {
    res.status(401).end();
  }

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
          updatedAt: new Date(),
          deletedAT: null,
        });
        res.json({ insertedId });
      }
    }
  });
});

export default router;
