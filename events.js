// Full Line Items Data: 
[
    {
      id: '28902434115',
      properties: {
        createdate: '2025-02-05T16:35:34.055Z',
        hs_lastmodifieddate: '2025-02-05T16:35:34.055Z',
        hs_object_id: '28902434115',
        name: 'kjsdb',
        price: '1231',
        quantity: '1'
      },
      createdAt: '2025-02-05T16:35:34.055Z',
      updatedAt: '2025-02-05T16:35:34.055Z',
      archived: false
    }
  ]
  [
    {
    id: '97132179531',
    properties: {
      createdate: '2025-02-05T13:44:47.145Z',
      email: 'sadvika@gmail.com',
      firstname: 'hi',
      hs_object_id: '97132179531',
      lastmodifieddate: '2025-02-05T16:35:35.316Z',
      lastname: ''
    },
    createdAt: '2025-02-05T13:44:47.145Z',
    updatedAt: '2025-02-05T16:35:35.316Z',
    archived: false
  }
]
//   👥 Full Contacts Data: 
  [
    {
      id: '97132179531',
      properties: {
        createdate: '2025-02-05T13:44:47.145Z',
        email: 'sadvika@gmail.com',
        firstname: 'hi',
        hs_object_id: '97132179531',
        lastmodifieddate: '2025-02-05T16:35:35.316Z',
        lastname: ''
      },
      createdAt: '2025-02-05T13:44:47.145Z',
      updatedAt: '2025-02-05T16:35:35.316Z',
      archived: false
    }
  ]

//   ✅ HubSpot Deal Details: 
  {
    id: '33108462948',
    properties: {
      amount: '1231',
      closedate: '2025-02-28T16:35:02.296Z',
      createdate: '2025-02-05T16:35:33.362Z',
      dealname: 'Deal',
      dealstage: 'contractsent',
      dealtype: null,
      hs_lastmodifieddate: '2025-02-05T16:35:37.609Z',
      hs_object_id: '33108462948',
      hs_priority: null,
      hubspot_owner_id: '69864216',
      pipeline: 'default'
    },
    createdAt: '2025-02-05T16:35:33.362Z',
    updatedAt: '2025-02-05T16:35:37.609Z',
    archived: false,
    associations: {
      'line items': { results: [Array] },
      contacts: { results: [Array] }
    }
  }
//   🔹 Raw HubSpot Deal Data:
   {
    "id": "33108462948",
    "properties": {
      "amount": "1231",
      "closedate": "2025-02-28T16:35:02.296Z",
      "createdate": "2025-02-05T16:35:33.362Z",
      "dealname": "Deal",
      "dealstage": "contractsent",
      "dealtype": null,
      "hs_lastmodifieddate": "2025-02-05T16:35:37.609Z",
      "hs_object_id": "33108462948",
      "hs_priority": null,
      "hubspot_owner_id": "69864216",
      "pipeline": "default"
    },
    "createdAt": "2025-02-05T16:35:33.362Z",
    "updatedAt": "2025-02-05T16:35:37.609Z",
    "archived": false,
    "associations": {
      "line items": {
        "results": [
          {
            "id": "28902434115",
            "type": "deal_to_line_item"
          }
        ]
      },
      "contacts": {
        "results": [
          {
            "id": "97132179531",
            "type": "deal_to_contact"
          }
        ]
      }
    }
  }