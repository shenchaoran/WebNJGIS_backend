export const APIS = {
    data: [{
        id: 'model-tools',
        pathname: '/modelser/json/all',
        desc: ''
    },
    {
        id: 'model-tool',
        pathname: '/modelser/json/:id',
        desc: ''
    },
    {
        id: 'model-input',
        pathname: '/modelser/preparation/json/:id',
        desc: ''
    },
    {
        id: 'model-invoke',
        pathname: '/modelser/:id',
        desc: 'ac=run'
    }],
    template: [{
        id: 'string',
        pathname: 'string',
        desc: 'string'
    }]
};