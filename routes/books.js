var express = require('express');
var books = express.Router();
var request = require('request');
var goodGuy = require('good-guy-http')({
    maxRetries: 3
});
var ESI = require('nodesi');

var jp = require('jsonpath');

/* GET users listing. */
books.get('/:isbn', function (req, res, next) {
    goodGuy('https://book-catalog-proxy.herokuapp.com/book?isbn=' + req.params.isbn).then(function (response) {
        var body = JSON.parse(response.body); // Show the HTML for the Google homepage.
        var cover = jp.value(body, '$..thumbnail');
        var title = jp.value(body, '$..title');
        var inventoryService = process.env.INVENTORY_SERVICE_URL + '/' + req.params.isbn;
        return new Promise(function (resolve, reject) {
            console.log(inventoryService);
            res.app.render('bookDetails', {
                    cover: cover,
                    title: title,
                    inventoryService: inventoryService
                },
                function (err, html) {
                    if (err) return reject(err);
                    else resolve(html);
                });
        });
    }).then(function (html) {
        return new ESI({
            onError: function (src, error) {
                if (error.statusCode === 404) {
                    return '<!-- 404' + src + ': Not found -->';
                }
                return '';
            }
        }).process(html);
    }).then(function (html) {
        res.send(html);
    }).catch(next);
});

module.exports = books;
