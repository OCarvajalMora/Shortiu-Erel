const app = new Vue({
    el: '#app',
    data: {
        url: '',
        slug: '',
        errorMessage: null,
        error: false,
        newUrl: null,
        urlCopied: false
    },
    methods: {
        async createUrl() {
            const response = await fetch('/url', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    url: this.url,
                    slug: this.slug
                })
            });

            const resData = await response.json();

            if(resData.message){
                this.error = true;
                this.errorMessage = resData.message;
            }else{
                this.error = false;
                this.newUrl = resData.basePath + '/' + resData.created.slug;
                this.url = this.newUrl;
                this.slug =  '';
                this.urlCopied =  false;
            }
        },
        copyNewUrl(){
            const newUrlInput = document.getElementById('url');
            newUrlInput.select();
            document.execCommand('copy');
            this.urlCopied = true;
        },
        setDefault(){
            this.url =  '';
            this.slug =  '';
            this.errorMessage =  null;
            this.error =  false;
            this.newUrl =  null;
            this.urlCopied =  false;
            document.getElementById('url').focus();
        }
    }
});