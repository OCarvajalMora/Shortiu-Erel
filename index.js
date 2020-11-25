const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const yup = require('yup');
const monk = require('monk');
const cors = require('cors');
const { nanoid } = require('nanoid');

require('dotenv').config();

const db = monk(process.env.MONGO_URI);

const ursl = db.get('urls');
ursl.createIndex('slug', {unique: true});

const app = express();


// middlewares
app.use(helmet({ contentSecurityPolicy: false}));
app.use(morgan('tiny'));
app.use(express.json());
app.use(cors());
app.use(express.static('./public'));

app.get('/:slug', async (req, res, next) => {
    const { slug } = req.params;
    try {
        const url = await ursl.findOne({ slug });
        if(url){
            res.redirect(url.url);
        }
        res.redirect('/error.html')
    } catch (error) {
        res.status(500);
    }
});

const schema = yup.object().shape({
    slug: yup.string().trim().matches(/^$|^[a-z0-9_\-]+$/i), // non white space; a to z; - and _; ignore case
    url: yup.string().trim().url().required(),
});

app.post('/url', async (req, res, next) => {

    let slug = req.body.slug.toLowerCase();
    const url = req.body.url.toLowerCase();

    try {        
        await schema.validate({
            slug,
            url
        });

        if(!slug){

            const randomSlugLength = 5;

            slug = nanoid(randomSlugLength);
            slug = slug.toLowerCase();

            const slugInUse = async () => {

                let slugStored = await ursl.findOne({ slug });

                if(slugStored){
                    slug = nanoid(randomSlugLength);
                    slug = slug.toLowerCase();
                    slugInUse();
                }
                
            }

            await slugInUse();

        }

        const newUrl = {
            url,
            slug
        };

        const created = await ursl.insert(newUrl);
        res.json({
            basePath: req.protocol + '://' + req.get('host'),
            created: created
        });

    } catch (error) {
        if (error.message.startsWith('E11000')) {
            error.message = 'Slug in use'
        }
        next(error);
    }
});

// request error handle
app.use((error, req, res, next) => {
    if(error.status){
        res.status(error.status);
    }else{
        res.status(500);
    }

    res.json({
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? 'Ooops! Please try again' : error.stack
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () =>{
    console.log(`Listening at http://localhost:${port}`);
});