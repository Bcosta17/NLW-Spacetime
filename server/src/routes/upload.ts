import { randomUUID } from "node:crypto";
import { FastifyInstance } from "fastify";
import { extname, resolve } from "node:path";
import { createWriteStream } from "node:fs";
import {  pipeline } from 'node:stream'; // usado para saber quando o processo de stream chegou ao final
import { promisify } from "node:util"; // transforma algumas funçoes mais antiga do node em uma promisse r

const pump = promisify(pipeline) 

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload', async (request, reply) => {
    console.log("aaa")
    console.log(request.file)
    const upload = await request.file({
      limits: {
        fileSize: 5_242_880, //5mb
      },
    })

    if(!upload) {
      return reply.status(400).send()
    }

    const mimeTypeRegex = /^(image|video)\/[a-zA-Z]+/
    const isValidFileFormat = mimeTypeRegex.test(upload.mimetype)

    if(!isValidFileFormat) {
      return reply.status(400).send()
    }

    const fileId = randomUUID()
    const extension = extname(upload.filename)

    const fileName = fileId.concat(extension)

    const writeStream = createWriteStream( 
      resolve(__dirname, '../../uploads', fileName),
    )

    await pump(upload.file, writeStream)
    
    const fullUrl = request.protocol.concat('://').concat(request.hostname)
    const fileUrl = new URL(`/uploads/${fileName}`, fullUrl).toString()
    
    return {fileUrl}
  })
}