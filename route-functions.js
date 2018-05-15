const mysql = require('promise-mysql');

const priv = {  //Создаю в отдельной переменной, чтобы сделать подобие приватных методов
  modifyBooksArray(booksArray) {
    return booksArray.map(book => {
      return Array(book.Title, 'Author ' + book.ID, book.PublishDate, book.Description, '/images/book-cover-' + book.ID + '.jpg');
    });
  },

  makeSqlFilter(filter) {
    let field, value;
    return filter.reduce((carry, item, key) => {
      if (!Array.isArray(item) || item.length != 2, !Array.isArray(item[1]))
        return carry;
      field = carry ? " AND " + item[0] : item[0];
      value = " IN ('" + item[1].join("' ,'") + "')";
      return carry + field + value;
    }, "");
  }
}

module.exports = class SqlController {

  constructor(config) {
    this.pool = mysql.createPool(config);
  }

  async puresql(sql) {
    try {
      let requestData = await this.pool.query(sql);
      return requestData;
    } catch (error) {
      console.error(error);
      return error.code;
    }
  }

  async generateBookTable(ctx, max = 100000) {
    try {
      await this.pool.query('DROP TABLE IF EXISTS `books`');
      await this.pool.query('CREATE TABLE books ( id INT(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, date VARCHAR(255), author VARCHAR(255),  description TEXT, image TEXT)');
      let i = 0, books = Array(), book, sqlQuery, queryValues = Array();
      books = await ctx.get(`http://fakerestapi.azurewebsites.net/api/Books`, null, {
        'User-Agent': 'koa-http-request'
      });
      books = JSON.parse(books);
      books = priv.modifyBooksArray(books);
      sqlQuery = "INSERT INTO books (title, author, date, description, image) VALUES ?";
      while (i <= max) {
        queryValues = queryValues.concat(books);
        i = queryValues.length;
        if (i > max) {
          queryValues = queryValues.slice(0, max);
        }
      }
      try {
        this.pool.query(sqlQuery, [queryValues]);
        return 'Готово';
      }
      catch (error) {
        console.error(error);
        return error.code;
      }
    } catch (error) {
      console.error(error);
      return error.code;
    }
  }

  async select(table, sort, select, filter, start, end) {
    let sqlSelect = "", sqlSort = "", sqlFilter = "", sqlLimit = "", sqlQuery = "", field, order, result;
    sqlSelect = select ? select.join(', ') : "*";
    if (sort)
      sqlSort = " ORDER BY " + sort.reduce((carry, item) => {
        field = Array.isArray(item) ? item[0] : item;
        order = item[1] == 'DESC' ? 'DESC' : 'ASC';
        return field + " " + order;
      });
    if (filter)
      sqlFilter = " WHERE " + priv.makeSqlFilter(filter);
    if (start) {
      sqlLimit = " LIMIT " + start;
      if (end) sqlLimit += ", " + (end - start);
    }
    sqlQuery = "SELECT " + sqlSelect + " FROM " + table + sqlFilter + sqlSort + sqlLimit;
    try {
      console.log(sqlQuery);
      result = await this.pool.query(sqlQuery);
      return result
    }
    catch (error) {
      console.log(error);
      return [];
    }
  }

  async add(table, fields) {
    let sqlFields = "", sqlValues = "", sqlQuery = "", field, sqlFieldsMarks, result;

    sqlFields = fields.reduce((carry, item, key) => {
      field = Array.isArray(item) ? item[0] : item;
      return carry ? carry + ", " + field : field;
    }, "");
    sqlValues = fields.reduce((carry, item) => {
      return Array.isArray(item) && item[1] ? carry.concat([item[1]]) : carry;
    }, []);
    sqlFieldsMarks = '(' + '?, '.repeat(fields.length - 1) + ' ?)';
    sqlQuery = 'INSERT INTO ' + table + '(' + sqlFields + ') VALUES ' + sqlFieldsMarks;
    try {
      console.log(sqlQuery);
      result = await this.pool.query(sqlQuery, sqlValues);
      return result;
    }
    catch (error) {
      console.log(error);
      return error.code;
    }
  }

  async update(table, fields, filter) {
    let sqlFilter = "", sqlSet = "", sqlQuery = "", update, result;

    if (filter)
      sqlFilter = " WHERE " + priv.makeSqlFilter(filter);

    sqlSet = fields.reduce((carry, item) => {
      if (Array.isArray(item) && item.length == 2) {
        update = carry ? ", " : " ";
        update += item[0] + " = '" + item[1] + "'";
        return carry + update;
      }
      return carry;
    }, "");
    sqlQuery = 'UPDATE ' + table + ' SET ' + sqlSet + sqlFilter;
    try {
      console.log(sqlQuery);
      result = await this.pool.query(sqlQuery);
      return result;
    }
    catch (error) {
      console.log(error);
      return error.code;
    }
  }
}