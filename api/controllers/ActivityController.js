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
  if (!userId) {
    return res.json(400, { error: 'No user provided.' });
  }
  sails.log(userId);
  const results = await sails.helpers.strava(userId);
  return res.json({
    data: results
  });
}
