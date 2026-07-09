import { IncomingMessage } from 'node:http';
import crypto from 'node:crypto';
import server from './server.js';

interface Booking {
    id: string;
    title: string;
    enabled: boolean;
}

const parseBody = <T>(req: IncomingMessage): Promise<T> => {
    return new Promise((resolve) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                resolve({} as T);
            }
        });
    });
};

let bookings: Booking[] = [];

const app = server();

app.get('/bookings', async (req, res) => {
    res.end(JSON.stringify({data: bookings}));
});

app.post('/bookings', async (req, res) => {
    const body = await parseBody<Omit<Booking, 'id'>>(req);

    if (!body.title) {
        res.statusCode = 400;
        res.end(JSON.stringify({message: 'Title not found'}));
        return;
    }

    const created = {
        id: crypto.randomUUID(),
        title: body.title,
        enabled: true,
    };

    bookings.push(created);

    res.end(JSON.stringify(created));
});

app.get('/bookings/:id', async (req, res) => {
    const id = req.params?.id ?? null;

    if (!id) {
        res.statusCode = 404;
        res.end(JSON.stringify({message: `Booking #${id} not found`}));
        return;
    }

    const booking = bookings.find(booking => booking.id === id);
    if (!booking) {
        res.statusCode = 404;
        res.end(JSON.stringify({message: `Booking #${id} not found`}));
        return;
    }

    res.end(JSON.stringify(booking));
});

app.post('/bookings/:id/cancel', async (req, res) => {
    const id = req.params?.id ?? null;

    if (!id) {
        res.statusCode = 404;
        res.end(JSON.stringify({message: `Booking #${id} not found`}));
        return;
    }

    let isUpdated = false;
    bookings = bookings.map((booking) => {
        if (booking.id === id) {
            isUpdated = true;
            return {...booking, enabled: false};
        }
        return booking;
    });

    if (!isUpdated) {
        res.statusCode = 404;
        res.end(JSON.stringify({message: `Booking #${id} not found`}));
        return;
    }

    res.end(JSON.stringify({status: 'OK'}));
});

app.listen(3035, () => console.log(`Server started at http://localhost:3035`));