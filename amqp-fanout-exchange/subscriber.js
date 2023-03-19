const amqplib = require('amqplib/callback_api');

amqplib.connect('amqp://localhost', (error, connection) => {
    if (error) return console.log(error);
    connection.createChannel((error, channel) => {
        if (error) return console.log(error);

        const exchangeName = 'post-office';
        const exchangeType = 'fanout';

        //Subscriber creates exchange if not exists.
        channel.assertExchange(exchangeName, exchangeType, { durable: true });

        //Subscriber creates a message queue dedicated for it.
        channel.assertQueue('', { exclusive: true }, (error, queue) => {
            if (error) return console.log(error);

            console.log("Waiting for messages....");

            channel.bindQueue(queue.queue, exchangeName, '');

            const consumeHandler = (msg) => {
                if (msg.content) {
                    console.log(msg.content.toString());
                    if (msg.content.toString() === 'done') {
                        channel.close((error) => {
                            error && console.log(error);
                            connection.emit('channel-closed');
                        });
                        return;
                    }
                }
            }

            channel.consume(queue.queue, consumeHandler, { noAck: true });
        });
    });

    connection.on('channel-closed', () => {
        connection.close((error) => error && console.log(error))
    });
});