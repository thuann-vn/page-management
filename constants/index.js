exports.MessageTypes = {
    chat: 'CHAT',
    comment: 'COMMENT'
}

exports.CustomerActionTypes = {
    'START_CONVERSATION': 'START_CONVERSATION',
    'CREATED_ORDER': 'CREATED_ORDER',
    'CANCEL_ORDER': 'CANCEL_ORDER',
}

exports.OrderStatuses = {
    'NEW': 10,
    'SHIPPING': 20,
    'COMPLETED': 30,
    'CANCELED': 40,
    'RETURNED': 50
}

exports.PaymentStatuses = {
    'PENDING': 10,
    'COMPLETED': 20
}
