const aws = require('aws-sdk')
const dynamoDB = new aws.DynamoDB({region: 'us-west-1', apiVersion: '2012-08-10'})

const DB_NAME = 'newsFeedSubscriber'

const getMember = (email) => {
    const params = {
        Key: {
            "email": { S: email }
        },
        TableName: DB_NAME
    }
    return new Promise ((resolve, reject) => {
        dynamoDB.getItem(params, function(err, data){
            if(err) return reject(err)
            resolve(data)
        })
    })
}



const updateMemberStatus = (email, active) => {
    const params = {
        Key: {
            "email": { S: email }
        },
        UpdateExpression: 'SET active = :activeValue',
        ExpressionAttributeValues: {':activeValue': {'BOOL': active}},
        TableName: DB_NAME
    }
    return new Promise ((resolve, reject) => {
        dynamoDB.updateItem(params, function(err, data){
            if(err) return reject(err)
            resolve(true)
        })
    })
}



const addNewMember = (email) => {
    const params = {
        Item: {
            "email": {S: email},
            "active": {
                BOOL: true
            }
        },
        TableName: DB_NAME
    }
    return new Promise ((resolve, reject) => {
        dynamoDB.putItem(params, function(err, data){
            if(err) return reject(err)
            resolve(true)
        })
    })
}




exports.handler = async(event) => {
    try{
        if(event.type==='SUBSCRIBE' && event.email){
            const item = await getMember(event.email)
            if(item && item.Item && item.Item.active && item.Item.active.BOOL){
                return { message: `Email ${event.email} is already subscribed` }
            }else if(item && item.Item && item.Item.active && item.Item.active.BOOL===false){
                if(await updateMemberStatus(event.email, true)){
                    return { message: `Email ${event.email} was succesfully subscribed.` }
                }
            }else{
                if(await addNewMember(event.email)){
                    return { message: `Email ${event.email} was succesfully subscribed` }
                }
            }
        }else if(event.type === 'UNSUBSCRIBE' && event.email){
            const item = await getMember(event.email)
            if(item && item.Item && item.Item.active && item.Item.active.BOOL){
                if(await updateMemberStatus(event.email, false)){
                    return { message: `Email ${event.email} was succesfully unsubscribed.` }
                }
            }else{
                return { message: `Email ${event.email} not found subscription list` }
            }
        }
        return { message: 'An unexpected error ocurred, please try again later.' }
    }catch(err){
        return { message: 'An unexpected error ocurred, please try again later.' }
    }
}