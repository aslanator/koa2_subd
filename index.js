

const Koa = require('koa'),
  KoaRouter = require('koa-router'),
  koaBody = require('koa-body'),
  koaRequest = require('koa-http-request'),
  dbconfig = require('./dbconfig.js'),
  SqlController = require('./route-functions.js');

const app = new Koa(),
  koaRouter = new KoaRouter(),
  sqlController = new SqlController(dbconfig);

koaRouter.get('/puresql/:sql', async (ctx, next) => {
  ctx.body = await sqlController.puresql(ctx.params.sql);
});

koaRouter.get('/generate-books-table/', async ctx => {
  ctx.body = await sqlController.generateBookTable(ctx, ctx.request.query.max);
});

koaRouter.get('/select/', async ctx => {
  ctx.body = await sqlController.select('books',
    Array(Array('ID', 'DESC'), Array('Title', 'ASC')),
    Array('ID', 'Title', 'Author'),
    Array(Array('Title', Array('Book 1', 'Book 2', 'Book 3'))),
    5,
    21);
});

koaRouter.get('/add/', async ctx => {
  ctx.body = await sqlController.add('books', Array(
    Array('Title', 'Book New'),
    Array('Author', 'Jonny'),
    Array('Description', 'Super description')
  ));
});

koaRouter.get('/update/', async ctx => {
  ctx.body = await sqlController.update('books', Array(
    Array('Title', 'Book New'),
    Array('Author', 'Jonny'),
    Array('Description', 'Super description')
  ),
    Array(Array('ID', [3])));
});

app
  .use(koaRequest({
    json: false,
    timeout: 2000,
    host: 'https://openlibrary.org'
  }))
  .use(koaBody())
  .use(koaRouter.allowedMethods())
  .use(koaRouter.routes());

app.listen(3000);