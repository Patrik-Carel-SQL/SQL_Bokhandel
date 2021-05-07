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
      SELECT
        ISBN13 as 'ISBN',
        Titel,
        FF.Förnamn + ' ' + FF.Efternamn as 'Författare',
        Pris
      FROM
        Böcker as B
      join Författare as FF on B.FörfattareID = FF.ID
    `;

		const connection = await sql.connect(process.env.CONNECTION);
		const result = await connection.request().query(query);
		//console.log(query)
		// console.log(result)
		res.render('bocker.pug', { bocker: result.recordset });
	} catch (ex) {
		console.log(ex);
	}
});

//Gets the ISBN code and book details
app.get('/book/:ISBN', async (req, res) => {
	const connection = await sql.connect(process.env.CONNECTION);
	const ISBN = req.params.ISBN;
	const data = `
	/*Select specifie book by ISBN*/ 
  SELECT  
		Titel,
		Pris,
		Utgivningsdatum,
		Sidor,
    FF.Förnamn + ' ' + FF.Efternamn as 'Name', ID
  FROM 
		dbo.Böcker as B
  JOIN Författare as FF on B.FörfattareID = FF.ID
  WHERE 
		B.ISBN13 =  @ISBN

	/*Select Shops*/

	SELECT ButikID, Butiksnamn FROM dbo.Butiker
	
	SELECT 
		ButikID, 
		Butiksnamn,
		isNULL(( select Antal from LagerSaldo where ButikID = Butiker.ButikID and ISBN = @ISBN),0) as 'Antal'
	FROM 
		dbo.Butiker

	
	`;
	const result = await connection.request().input('ISBN', sql.BigInt, ISBN).query(data);

	resultBok = result.recordset[0];
	resultButik = result.recordsets[1];
	resultLager = result.recordsets[2];

	//Fethces book details from a specific ISBN13 number
	res.render('book.pug', {
		// För Boken
		title: resultBok.Titel,
		price: resultBok.Pris + ' ' + 'kr',
		publishDate: new Date(resultBok.Utgivningsdatum),
		author: resultBok.Name,
		sidor: resultBok.Sidor,

		// För Butiker
		butikList: resultButik,
		butikLager: resultLager,
		ISBN13: ISBN,
	});
	// console.log(result.recordsets[1][0]);
	console.log(result.recordsets);
	// console.log(result.recordsets[2]);
	// console.log(resultLager[0].Antal)
	console.log(result.recordsets);
	// console.log(result.recordsets[2].Antal)
});

app.listen(3000, () => {
	console.log('Server is now online with port 3000.');
});
