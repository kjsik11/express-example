import { Router } from 'express';
import Joi from 'joi';
import got from 'got';
import { parseStringPromise } from 'xml2js';
import httpStatus from 'http-status';

import checkApiKey from '../../middlewares/check-api-key.js';
import ApiError from '../../utils/api-error.js';

const router = Router();

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

router.post('/', async (req, res, next) => {
  const checkBodySchema = Joi.object({
    applicationNumber: Joi.number().label('applicationNumber').required(),
  });

  const { applicationNumber } = await checkBodySchema
    .validateAsync(req.body)
    .catch((err) => next(new ApiError(httpStatus.BAD_REQUEST, err.message)));

  try {
    const xmlData = await got
      .get(url, {
        searchParams: {
          accessKey,
          applicationNumber,
        },
      })
      .text();

    const {
      response: {
        body: { items },
      },
    } = await parseStringPromise(xmlData, {
      explicitArray: false,
    });

    if (items.TotalSearchCount === '0')
      return next(new ApiError(httpStatus.NOT_FOUND, 'No such trademark item'));

    const { db } = req.app.locals;

    const tradeMark = await db
      .collection('trademark')
      .findOne({ 'tradeMarkInfo.ApplicationNumber': String(applicationNumber), deleted: null });

    if (tradeMark) return next(new ApiError(httpStatus.NOT_MODIFIED));

    const { insertedId } = await db.collection('trademark').insertOne({
      tradeMarkInfo: items.TradeMarkInfo,
      createdAt: new Date(),
    });

    return res.json({ insertedId });
  } catch (err) {
    return next(new ApiError(res.status, err.message));
  }
});

export default router;
