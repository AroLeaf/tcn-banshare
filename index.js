const fastify = require('fastify').default();
const ffStatic = require('@fastify/static');
const ffCookie = require('@fastify/cookie');
const ffFormbody = require('@fastify/formbody');

const path = require('path');

const Webhook = require('./webhook.js');
require('dotenv/config');

fastify.register(ffStatic, {
  root: path.resolve(__dirname, 'public'),
});
fastify.register(ffCookie);
fastify.register(ffFormbody);

const users = new Map();


async function getDiscordUser(id) {
  let user = users.get(id);
  if (user) return user;
  user = await fetch('https://discord.com/api/v10/users/' + id, { headers: { 'Authorization': `Bot ${process.env.DSC_TOKEN}` } }).then(res => res.ok && res.json());
  users.set(id, user);
  return user;
}

fastify.addHook('onRequest', async (request, reply) => {
  const apiUser = request.cookies.token && await fetch(`${process.env.API_URL}/auth/user`, { headers: { 'Authorization': request.cookies.token } }).then(res => res.ok && res.json());
  if (!apiUser) await reply.redirect(`${process.env.AUTH_URL}?redirect=${encodeURIComponent(process.env.OWN_URL)}`);
  request.user = await getDiscordUser(apiUser.id);
});


fastify.get('/', async (request, reply) => {
  console.log(request.user);
  return reply.sendFile('index.html');
});


fastify.post('/submit', async (request, reply) => {
  const message = `
**user id(s):** ${request.body.id}
**username(s):** ${request.body.username}
**reason(s):** ${request.body.reason}
**evidence:** ${request.body.evidence}
**Submitted by:** ${request.user.username}#${request.user.discriminator} (${request.user.id})
  `

  const msgData = {
    content: message.length > 2000 ? '[file]' : message,
    files: message.length > 2000 ? [{ filename: 'message.md', attachment: message }] : undefined,
    username: 'TCN Banshare',
    avatar_url: 'https://banshare.teyvatcollective.network/logo.png',
    allowed_mentions: { parse: [] },
  }

  await Webhook.send(process.env.WEBHOOK_URL, msgData);
  return reply.sendFile('submitted.html');
});


fastify.listen({ port: process.env.PORT }).then(() => {
  console.log('ready!');
});
