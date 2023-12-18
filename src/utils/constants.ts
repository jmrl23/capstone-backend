// format:  PREFIX_TOPIC
// example: A_TEST

// prefix meanings:
// B = both
// I = iot
// A = app
export enum TOPICS {
  // pressing the button on iot
  I_PRESS = 'I_PRESS',

  // pressing the ring button on application
  A_RING = 'A_RING',

  // trigger sync on both iot and application
  B_SYNC = 'B_SYNC',

  // syncing data on iot
  // format:  r
  // example: 0
  I_SYNC = 'I_SYNC',

  // syncing data on application
  // make a request which will revalidate the
  // list of devices and their informations
  A_SYNC = 'A_SYNC',
}
