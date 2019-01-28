/**
 * ActivityController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  ingest: ingest

};

async function ingest(req, res) {
  const userId = req.params.userId;
  const getAll = req.param('getAll');
  console.log('getall', getAll);
  sails.log(getAll);
  if (!userId) {
    return res.json(400, { error: 'No user provided.' });
  }
  const results = await sails.helpers.strava(userId, getAll);
  return res.json({
    msg: results
  });
}
