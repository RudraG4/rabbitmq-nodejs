const amqplib = require('amqplib/callback_api');

function* generateToken() {
    let count = 30;
    while (count != 0) {
        yield count--;
    }
}


amqplib.connect('amqp://localhost', (error, connection) => {
    if (error) return console.log(error);

    connection.createChannel((error, channel) => {
        if (error) return console.log(error);

        const exchangeName = 'post-office';
        const exchangeType = 'fanout';

        //Publisher sends message to exchange named post-office
        channel.assertExchange(exchangeName, exchangeType, { durable: true });

        const generator = generateToken();
        const interval = setInterval(() => {
            const genObj = generator.next();
            if (!genObj.value || genObj.done) {
                clearInterval(interval);
                channel.publish(exchangeName, '', Buffer.from('done'));
                channel.close((error) => {
                    error && console.log(error);
                    connection.emit('channel-closed');
                });
                console.log('Done Sending Tokens');
                return;
            }
            const content = `message: Message Token ${genObj.value}`;
            channel.publish(exchangeName, '', Buffer.from(content));
        }, 2000);
    });

    connection.on('channel-closed', () => {
        connection.close((error) => error && console.log(error))
    });
});
