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
    `;

		const connection = await sql.connect(process.env.CONNECTION);
		const result = await connection.request().query(query);
		console.log(query);

		res.render('bocker.pug', { bocker: result.recordset });
	} catch (ex) {
		console.log(ex);
	}
});

//Gets the ISBN code and book details
app.get('/book/:ISBN', async (req, res) => {
	const connection = await sql.connect(process.env.CONNECTION);
	const ISBN = req.params.ISBN;
	const title = `
	select Titel from dbo.Böcker where ISBN13 = @ISBN
  	select Pris from dbo.Böcker where ISBN13 = @ISBN
  	select Utgivningsdatum from dbo.Böcker where ISBN13 = @ISBN
  	SELECT  
    Förnamn + ' ' + Efternamn as 'Name', ID
  	FROM dbo.Författare as FF
    JOIN Böcker as B on FF.ID = B.FörfattareID
    WHERE B.ISBN13 =  @ISBN

	SELECT ButikID FROM dbo.LagerSaldo WHERE ISBN = @ISBN
	SELECT Antal FROM dbo.LagerSaldo WHERE ISBN = @ISBN
	`;
	const result = await connection.request().input('ISBN', sql.BigInt, ISBN).query(title);
	console.log(result.recordsets[4][0].ButikID);

	//Fethces book details from a specific ISBN13 number
	res.render('book.pug', {
		title: result.recordset[0].Titel,
		price: result.recordsets[1][0].Pris + ' ' + 'kr',
		publishDate: new Date(result.recordsets[2][0].Utgivningsdatum),
		author: result.recordsets[3][0].Name,
		butikID: result.recordsets[4][0].ButikID,
		antal: result.recordsets[5][0].Antal,
		ISBN13: ISBN,
	});
});

app.listen(3000, () => {
	console.log('Server is now online with port 3000.');
});
