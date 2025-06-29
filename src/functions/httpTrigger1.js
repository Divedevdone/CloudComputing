const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('Função ContadorVisitas acionada por HTTP.');

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

        const result = await pool.request()
            .query(`
                UPDATE SiteVisits
                SET visit_count = visit_count + 1, last_updated = GETDATE()
                WHERE id = 1;

                SELECT visit_count FROM SiteVisits WHERE id = 1;
            `);

        const currentCount = result.recordset[0].visit_count;
        context.log(`Contador atualizado para: ${currentCount}`);

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'text/plain'
            },
            body: currentCount.toString()
        };

    } catch (err) {
        context.log.error('Erro ao conectar ou consultar o banco de dados:', err.message);
        context.res = {
            status: 500,
            body: "Erro interno do servidor ao processar a visita."
        };
    } finally {
        if (pool) {
            try {
                await pool.close();
                context.log('Conexão com o banco de dados SQL fechada.');
            } catch (closeErr) {
                context.log.error('Erro ao fechar a conexão SQL:', closeErr.message);
            }
        }
    }
};