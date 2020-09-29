const express = require('express')
const router = express.Router()
const graphDBConnect = require('../middleware/graphDBConnect')

const formatRecord = (result) => {
    let nodes = new Map()
    let links = []
    for (let record of result.records) {
        const { _fields } = record
        for(let i = 0; i < _fields.length; i++) {
            const filed = _fields[i]
            const { properties } = filed
            if (i % 2 === 0) {
                const nodeId = filed.identity.low
                if (nodes.has(nodeId)) {
                    continue
                }
                const nodeType = filed.labels[0]
                nodes.set(nodeId, { nodeId, nodeType, ...properties})
            } else {
                const linkType = filed.type
                const sourceId = filed.start.low
                const targetId = filed.end.low
                links.push({ sourceId, targetId, linkType, ...properties})
            }
        }
    }
    return { nodes: [...nodes.values()], links }
}

const formatSummary = (result) => {
  return result.summary.updateStatistics._stats
}

const encodeParamsObject = (params) => {
    return Object.keys(params).map(key => `${key}: '${params[key]}'`).join(',')
}

router.post('/create/node', async (req, res) => {
    const { nodeType, newNode } = req.body
    if (!nodeType || !newNode) {
        return res.status(400).send('Invalid Params')
    }
    const query = `CREATE (n: ${nodeType} {${encodeParamsObject(newNode)}}) return n`
    const result = await graphDBConnect.executeCypherQuery(query)
    res.send(formatSummary(result))
})

router.post('/create/link', async (req, res) => {
    let { sourceName, targetName, relType, newLink } = req.body
    if (!sourceName || !targetName) {
        return res.status(400).send('Invalid Params')
    }
    const query = `MATCH (a {name: '${sourceName}'}),(b {name: '${targetName}'}) CREATE (a)-[r: ${relType} {${encodeParamsObject(newLink)}}]-(b) RETURN r`
    const result = await graphDBConnect.executeCypherQuery(query)
    res.send(formatSummary(result))
})

router.get('/node/:nodeType', async (req, res) => {
    const { nodeType } = req.params
    const query = nodeType === 'all'
      ? 'MATCH (n) RETURN n'
      : `MATCH (n: ${nodeType}) RETURN n`
    const result = await graphDBConnect.executeCypherQuery(query)
    res.send(formatRecord(result))
})

router.post('/search', async (req, res) => {
    let { nodeName, linkType } = req.body
    if (!nodeName) {
        return res.status(400).send('Invalid Params')
    }
    const query = `MATCH (n)-[r: ${linkType}]-(any) WHERE exists((n)-[]-({name: '${nodeName}'})) RETURN n, r, any`
    const result = await graphDBConnect.executeCypherQuery(query)
    res.send(formatRecord(result))
})

router.put('/update/node', async (req, res) => {
    const { nodeName, newNode } = req.body
    if (!nodeName) {
        return res.status(400).send('Invalid Params')
    }
    const query = `MATCH (n {name: '${nodeName}'}) SET n = {${encodeParamsObject(newNode)}}`
    const result = await graphDBConnect.executeCypherQuery(query)
    res.send(formatSummary(result))
})

router.put('/update/link', async (req, res) => {
    const { sourceName, targetName, newLink } = req.body
    if (!sourceName || !targetName) {
        return res.status(400).send('Invalid Params')
    }
    const query = `MATCH (a {name: '${sourceName}'})-[r]-(b {name: '${targetName}'}) set r = {${encodeParamsObject(newLink)}}`
    const result = await graphDBConnect.executeCypherQuery(query)
    res.send(formatSummary(result))
})

router.delete('/delete/node', async (req, res) => {
    const { nodeName } = req.body
    if (!nodeName) {
        return res.status(400).send('Invalid Params')
    }
    const query = `MATCH (n {name: '${nodeName}'})-[r]-() DELETE n, r`
    const result = await graphDBConnect.executeCypherQuery(query)
    res.send(formatSummary(result))
})

router.delete('/delete/link', async (req, res) => {
    const { sourceName, targetName } = req.body
    if (!sourceName || !targetName) {
        return res.status(400).send('Invalid Params')
    }
    const query = `MATCH (a {name: '${sourceName}'})-[r]-(b {name: '${targetName}'}) DELETE r`
    const result = await graphDBConnect.executeCypherQuery(query)
    res.send(formatSummary(result))
})

module.exports = router
