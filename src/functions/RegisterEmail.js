const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('Função RegisterEmail (HTTP Trigger) acionada.');

    const email = (req.query.email || (req.body && req.body.email));

    if (!email) {
        context.res = {
            status: 400,
            body: "Por favor, forneça um endereço de e-mail."
        };
        return;
    }

    const config = {
        user: process.env.SqlDbUser,
        password: process.env.SqlDbPassword,
        server: process.env.SqlDbServer,
        database: process.env.SqlDbDatabase,
        options: {
            encrypt: true,
            trustServerCertificate: false
        }
    };

    let pool;
    try {
        pool = await sql.connect(config);
        context.log('Conexão com o banco de dados SQL estabelecida.');

        // Verifica se o email já existe para evitar duplicatas (e erros de UNIQUE constraint)
        const checkResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT COUNT(*) AS Count FROM RegisteredEmails WHERE Email = @email');

        if (checkResult.recordset[0].Count > 0) {
            context.res = {
                status: 409, // Conflict
                body: "Este e-mail já está registrado."
            };
            return;
        }

        // Insere o novo email
        await pool.request()
            .input('email', sql.NVarChar, email)
            .query('INSERT INTO RegisteredEmails (Email) VALUES (@email)');

        context.log(`Email '${email}' registrado com sucesso no banco de dados.`);

        context.res = {
            status: 200,
            body: "E-mail registrado com sucesso!"
        };

    } catch (err) {
        context.log.error(`Erro ao registrar o email '${email}':`, err.message);
        context.res = {
            status: 500,
            body: `Erro interno do servidor ao registrar o e-mail: ${err.message}`
        };
    } finally {
        if (pool) {
            try {
                await pool.close();
                context.log('Conexão SQL fechada.');
            } catch (closeErr) {
                context.log.error('Erro ao fechar conexão SQL:', closeErr.message);
            }
        }
    }//
};