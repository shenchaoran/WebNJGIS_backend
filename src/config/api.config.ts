export const APIS = {
    data: [
        {
            id: 'connector',
            pathname: '/ping',
            desc: ''
        },
        {
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
            id: 'model-schemas',
            pathname: '/modelser/mdl/:id',
            desc: ''
        },
        {
            id: 'model-invoke',
            pathname: '/modelser/:id',
            desc: 'ac=run'
        },
        {
            id: 'upload-geo-data',
            pathname: '/geodata',
            desc: ''
        },
        {
            id: 'download-geo-data',
            pathname: '/geodata/detail/:id',
            desc: ''
        },
        {
            id: 'invoke-record',
            pathname: '/modelserrun/json/:id',
            desc: ''
        }
    ],
    template: [
        {
            id: 'string',
            pathname: 'string',
            desc: 'string'
        }
    ]
};
