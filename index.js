const fastify = require('fastify').default();
const ffStatic = require('@fastify/static');
const ffCookie = require('@fastify/cookie');
const ffFormbody = require('@fastify/formbody');

const path = require('path');

const Oauth = require('./oauth.js');
const Webhook = require('./webhook.js');
require('dotenv/config');

fastify.register(ffStatic, {
  root: path.resolve(__dirname, 'public'),
});
fastify.register(ffCookie);
fastify.register(ffFormbody);

const users = new Map();


fastify.get('/', async (request, reply) => {
  if (!users.has(request.cookies.token)) return reply.redirect('/oauth');
  return reply.sendFile('index.html');
});


fastify.get('/oauth', async (request, reply) => {
  if (!request.query.code) return reply.redirect(`https://discord.com/oauth2/authorize?response_type=code&client_id=${process.env.DSC_ID}&scope=identify&redirect_uri=${process.env.DSC_REDIRECT}`);

  const tokens = await Oauth.token({
    client_id: process.env.DSC_ID,
    client_secret: process.env.DSC_SECRET,
    code: request.query.code,
    redirect_uri: process.env.DSC_REDIRECT,
  });
  
  const user = await Oauth.user(tokens);
  users.set(tokens.access_token, user);

  reply.setCookie('token', tokens.access_token, { sameSite: 'lax' });
  return reply.redirect('/');
});


fastify.post('/submit', async (request, reply) => {
  const user = users.get(request.cookies.token);
  if (!user) return reply.redirect('/oauth');

  const inAPI = await fetch(`https://api.teyvatcollective.network/users/${user.id}`).then(res => res.ok);
  if (!inAPI) return reply.sendFile('no_access.html');

  const message = `
**username(s):** ${request.body.username}
**user id(s):** ${request.body.id}
**reason(s):** ${request.body.reason}
**evidence:** ${request.body.evidence}
**Submitted by:** ${user.username}#${user.discriminator} (${user.id})
  `

  const msgData = {
    content: message.length > 2000 ? '[file]' : message,
    files: message.length > 2000 ? [{ filename: 'message.md', attachment: message }] : undefined,
    username: 'TCN Banshare',
    avatar_url: 'https://banshare.teyvatcollective.network/logo.png',
    allowed_mentions: { parse: [] },
  }

  await Webhook.send(process.env.HQ_URL, msgData);
  await Webhook.send(process.env.HUB_URL, msgData);
  
  return reply.sendFile('submitted.html');
});


fastify.listen({ port: process.env.PORT }).then(() => {
  console.log('ready!');
});