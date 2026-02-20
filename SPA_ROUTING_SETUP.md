# SPA Routing Configuration Guide

This project is a Single Page Application (SPA) using React Router. 
To prevent 404 errors when refreshing pages with routes like `/menu`, `/gallery`, etc., 
the server must be configured to redirect all requests to `index.html`.

## Configuration Files

### For Different Hosting Platforms:

#### 1. **Apache Server** (.htaccess)
- File: `.htaccess`
- Contains rewrite rules to redirect all non-file requests to index.html
- Ensure `mod_rewrite` is enabled on your Apache server

#### 2. **Nginx Server** (nginx.conf)
- File: `nginx.conf`
- Contains server configuration with `try_files` directive
- Use this as a reference for your Nginx server configuration

#### 3. **Vercel**
- File: `vercel.json`
- Automatic configuration when deployed to Vercel
- Routes all non-asset requests to index.html

#### 4. **Firebase Hosting**
- File: `firebase.json`
- Automatic configuration when deployed to Firebase
- Uses rewrite rules for SPA routing

#### 5. **Netlify**
- File: `netlify.toml`
- Automatic configuration when deployed to Netlify
- Redirects all requests with 200 status to index.html

## Deployment Instructions

### If using Apache:
1. Copy the `.htaccess` file to your public_html root directory
2. Ensure `AllowOverride All` is set in Apache configuration
3. Restart Apache

### If using Nginx:
1. Use `nginx.conf` as reference for your server block configuration
2. The key directive is: `try_files $uri $uri/ /index.html;`
3. Reload Nginx: `sudo nginx -s reload`

### If using Vercel:
1. Deploy normally - vercel.json will be used automatically
2. No additional configuration needed

### If using Firebase:
1. Run: `firebase deploy`
2. firebase.json configuration will be applied automatically

### If using Netlify:
1. Connect your repository
2. netlify.toml will be detected and applied automatically

## Testing

After deployment, test the following URLs by directly visiting them (not via navigation links):
- https://yourdomain.com/menu
- https://yourdomain.com/gallery
- https://yourdomain.com/reviews
- https://yourdomain.com/admin

If React loads and routes work correctly, the configuration is successful.
