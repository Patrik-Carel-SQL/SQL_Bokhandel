const express = require('express');
const sql = require('mssql');

require('dotenv').config();

const app = express();

app.set('view engine', 'pug');
app.locals.pretty = true;

app.get('/', async (req, res) => {
	try {
		// Setup select from SQL server
		const query = `
      select
        ISBN13 as 'ISBN',
        Titel,
        FF.Förnamn + ' ' + FF.Efternamn as 'Name',
        Pris
      from
        Böcker as B
      join Författare as FF on B.FörfattareID = FF.ID
    `
    
    const connection = await sql.connect(process.env.CONNECTION)
    const result = await connection.request()
      .query(query)
    //console.log(query)
    
    res.render('bocker.pug', {bocker: result.recordset})

	} catch (ex) {
		console.log(ex);
	}
});

//Gets the ISBN code and book details
app.get('/book/:ISBN', async (req, res) => {
	const ISBN = req.params.ISBN;

	const title = `
      select Titel from dbo.Böcker where ISBN13 = "%" + @ISBN + "%"
  `;
  const connection = await sql.connect(process.env.CONNECTION)
  const result = await connection.request()
    .input('ISBN', sql.BigInt, req.ISBN)
    .query(query)
  console.log(query)

	res.render('book.pug', {
		title: result.Titel,
		//author: authorSQL,
		//price: priceSQL,
		//publishDate: publishDateSQL,
	});
	res.send(ISBN);
});

app.listen(3000, () => {
	console.log('Server is now online with port 3000.');
});
