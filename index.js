/* Description:
 *   Loads content from RSS feeds.
 *
 * Dependencies:
 *   none
 *
 * Author:
 *    mythmon
 */

var Promise = require('es6-promise').Promise;
var FeedParser = require('feedparser');

module.exports = function(corsica) {

  corsica.on('rss', function(content) {
    var url = content.url || content._args[0];
    var itemNum = content.item || 0;

    new Promise(function(resolve, reject) {
      corsica.request({url: url}, function(err, res, data) {
        if (err || res.statusCode >= 400) {
          reject(err || {statusCode: res.statusCode});
        } else {
          resolve(data);
        }
      });
    })
    .then(getItemsFromRss)
    .then(function(items) {
      if (itemNum === 'latest') {
        itemNum = 0;
      } else if (itemNum === 'random') {
        itemNum = Math.floor(Math.random() * items.length);
      }

      corsica.sendMessage('content', {
        url: items[itemNum].link,
        screen: content.screen,
      });
    });

    return content;
  });

  function getItemsFromRss(content) {
    return new Promise(function(resolve, reject) {
      var parser = new FeedParser();
      var items = [];

      parser.on('error', function(error) {
        reject(error);
      });

      parser.on('readable', function() {
        var stream = this;
        var item;
        while (item = stream.read()) {
          items.push(item);
        }
        resolve(items);
      });

      parser.write(content);
    });
  }
};
