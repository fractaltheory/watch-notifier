#!/bin/node
const schedule = require('node-schedule')
const request = require('request')
const querystring = require('querystring')
const nodemailer = require('nodemailer')
const moment = require('moment-timezone')

const NAME = process.env.AN_NAME
const FROM_EMAIL = process.env.FROM_EMAIL
const TO_EMAIL = process.env.TO_EMAIL || process.env.FROM_EMAIL
const PASSWORD = process.env.AN_PASSWORD
const POST_CODE = process.env.POST_CODE

const URL = 'http://www.apple.com/ca/shop/retail/pickup-message'
const DEFAULT_MODELS = [
    'MNNY2CL/A', // Sport band
    'MNP02CL/A' // Nylon strap
]

const MODELS = (process.env.AN_MODELS && process.env.AN_MODELS.split(' ')) || DEFAULT_MODELS

const constructUrl = (model) => {
    return `${URL}?${querystring.stringify({
        'parts.0': model,
        'location': POST_CODE
    })}`
}

const getTheTime = (isFullDate) => {
    const format = isFullDate ? 'MMM Do, h:mm a' : 'h:mm:ss a'
    return moment(new Date().toISOString()).tz('America/Vancouver').format(format)
}

const getDistance = (str) => {
    return parseInt(str.replace(/\s+km/, ''), 10)
}

const craftBody = (stores, model) => {
    var body = `${model} available at the following stores; ${getTheTime(true)}:\n` + (
        model === MODELS[0] ?
            'http://www.apple.com/ca/shop/buy-watch/apple-watch/rose-gold-aluminium-pink-sand-sport-band?product=MNNY2CL/A&step=detail\n\n'
            :
            'http://www.apple.com/ca/shop/buy-watch/apple-watch/rose-gold-aluminium-light-pink-midnight-blue-woven-nylon?product=MNP02CL/A&step=detail\n\n'
    )

    stores.forEach((store) => {
        body += `${store.storeName}\n${store.hours}\n`
    })

    return body
}

const sendMail = (availableStores, model) => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport(`smtps://${encodeURIComponent(FROM_EMAIL)}:${PASSWORD}`)

        const body = craftBody(availableStores, model)
        const mailOptions = {
            from: `${NAME} <${FROM_EMAIL}>`,
            to: TO_EMAIL,
            subject: 'Apple Watch is available for pickup',
            text: body
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(error)
                reject(error)
            } else {
                console.log('Message sent: ' + info.response)
                resolve()
            }
        })
    })
}

const outputHours = (hours) => {
    var str = ''

    hours.forEach((hour) => {
        str += `${hour.storeDays} ${hour.storeTimings}\n`
    })

    return str
}

const isAvailable = (detail) => {
    return detail !== 'unavailable' &&
        detail !== 'ships-to-store'
}

var JOB

const makeRequest = () => {
    MODELS.forEach((model) => {
        request(constructUrl(model), (error, response, body) => {
            if (error) {
                console.error(error)
                JOB.cancel()
            } else {
                var availableStores = []

                try {
                    const resp = JSON.parse(body)
                    const stores = resp.body.stores

                    stores.forEach((store) => {
                        const modelAvailability = store.partsAvailability[model]
                        const storeName = store.storeName
                        const dist = getDistance(store.storeDistanceWithUnit)
                        const storeHours = store.storeHours.hours

                        if (dist < 22 && isAvailable(modelAvailability.pickupDisplay)) {
                            console.log(`Apple Watch model ${model} found at ${storeName}`)

                            availableStores.push({
                                modelName: modelAvailability.storePickupProductTitle,
                                storeName: storeName,
                                hours: outputHours(storeHours)
                            })
                        }
                    })
                } catch(e) {
                    console.log(e.message)
                }

                if (availableStores.length > 0) {
                    console.log('Dispatching e-mail.')
                    sendMail(availableStores, model).then(() => {
                        JOB.cancel()
                    })
                } else {
                    console.log(`[${getTheTime(false)}] Model ${model} not found.`)
                }
            }
        })
    })
}

const scheduleJob = () => {
    console.log('Searching for available Apple Watches every three minutes...')
    // Once per 3 minutes
    const rule = '*/5 * * * *'
    JOB = schedule.scheduleJob(rule, makeRequest);
}

scheduleJob()
