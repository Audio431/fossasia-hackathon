/**
 * Simple HTTP server for E2E testing
 * Serves test pages on http://localhost:8080
 */

import { http } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  // Serve Instagram DM test page
  http.get('http://localhost:8080/instagram-dm', async ({ request }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Instagram DM - Test</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 20px; background: #fafafa; }
          .chat-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; }
          .message-list { height: 400px; overflow-y: auto; border: 1px solid #dbdbdb; margin-bottom: 20px; padding: 10px; }
          .message { margin: 10px 0; padding: 10px; border-radius: 8px; }
          .message.received { background: #efefef; }
          .message.sent { background: #0095f6; color: white; margin-left: auto; }
          .input-area { display: flex; gap: 10px; }
          textarea { flex: 1; padding: 12px; border: 1px solid #dbdbdb; border-radius: 22px; resize: none; font-family: -apple-system, sans-serif; }
          button { padding: 10px 20px; background: #0095f6; color: white; border: none; border-radius: 22px; font-weight: 600; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="chat-container">
          <h2>Instagram DM</h2>
          <div class="message-list">
            <div class="message received">Hey! I'm a stranger from the internet 😊</div>
          </div>
          <div class="input-area">
            <textarea id="message-input" placeholder="Message..." rows="2"></textarea>
            <button onclick="sendMessage()">Send</button>
          </div>
        </div>
        <script>
          function sendMessage() {
            const input = document.getElementById('message-input');
            const text = input.value.trim();
            if (text) {
              const list = document.querySelector('.message-list');
              const msg = document.createElement('div');
              msg.className = 'message sent';
              msg.textContent = text;
              list.appendChild(msg);
              input.value = '';
              list.scrollTop = list.scrollHeight;
            }
          }

          document.getElementById('message-input').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          });
        </script>
      </body>
      </html>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }),

  // Serve comment section test page
  http.get('http://localhost:8080/comment-section', async () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Instagram Post - Test</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 20px; background: #fafafa; }
          .post { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .post-image { height: 400px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .post-actions { padding: 15px; border-bottom: 1px solid #efefef; }
          .post-actions button { background: none; border: none; font-size: 24px; margin-right: 15px; cursor: pointer; }
          .comments { padding: 15px; }
          .comment-input { display: flex; gap: 10px; margin-top: 15px; }
          textarea { flex: 1; padding: 10px; border: 1px solid #dbdbdb; border-radius: 22px; resize: none; font-family: -apple-system, sans-serif; }
          button { padding: 8px 16px; background: #0095f6; color: white; border: none; border-radius: 22px; font-weight: 600; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="post">
          <div class="post-image"></div>
          <div class="post-actions">
            <button>♡</button>
            <button>💬</button>
            <button>✈</button>
          </div>
          <div class="comments">
            <p><strong>cool_user</strong> Nice photo! 📸</p>
            <div class="comment-input">
              <textarea id="comment-input" placeholder="Add a comment..." rows="2"></textarea>
              <button onclick="postComment()">Post</button>
            </div>
          </div>
        </div>
        <script>
          function postComment() {
            const input = document.getElementById('comment-input');
            const text = input.value.trim();
            if (text) {
              const comments = document.querySelector('.comments');
              const comment = document.createElement('p');
              comment.innerHTML = '<strong>you</strong> ' + text;
              comments.insertBefore(comment, input.parentElement);
              input.value = '';
            }
          }
        </script>
      </body>
      </html>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }),
];

export const testServer = setupServer(...handlers);
