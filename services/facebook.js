const graph = require('fbgraph');
exports.getMessageById = async (pageToken, id) => {
    var promise = new Promise((resolve) => {
        graph.setAccessToken(pageToken);
        graph.get(`${id}?fields=sticker,message,from,created_time,tags,to,attachments,shares`, (err, result) => {
            if (err) {
                return resolve(null);
            }
            resolve(result);
        });
    })

    return promise;
}

exports.getThreadByUserId = async (pageToken, userId) => {
    var promise = new Promise((resolve) => {
        graph.setAccessToken(pageToken);
        graph.get(`/me/conversations?fields=unread_count,participants,is_subscribed,snippet,updated_time&user_id=${userId}`, (err, result) => {
            if (err) {
                console.error(err);
                return resolve(null);
            }
            resolve(result.data && result.data.length ? result.data[0] : null);
        });
    })

    return promise;
}

exports.getPageUserById = async (pageToken, userId) => {
    var promise = new Promise((resolve) => {
        graph.setAccessToken(pageToken);
        graph.get(`${userId}`, (err, result) => {
            if (err) {
                console.error(err);
                return resolve(null);
            }
            resolve(result);
        });
    })

    return promise;
}

module.exports.Facebook = exports;