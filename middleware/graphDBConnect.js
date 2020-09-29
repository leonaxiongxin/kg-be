const neo4j = require('neo4j-driver')
const config = require('config')

const uri = config.get('dbHost')
const user = config.get('dbUser')
const password = config.get('dbPass')

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionLifeTime: 3 * 60 * 60 * 1000,
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 2 * 60 * 1000,
    disableLossLessIntegers: true
})

async function executeCypherQuery(statement, params = {}) {
    console.log('statement', statement)
    const session = driver.session()
    try {
        const result = await session.run(statement, params)
        session.close()
        return result
    } catch (error) {
        throw error  // log error when this method was called
    }
}

module.exports = { executeCypherQuery }