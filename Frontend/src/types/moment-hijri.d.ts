declare module 'moment-hijri' {
  import moment from 'moment';
  
  function momentHijri(inp?: moment.MomentInput): moment.Moment;
  
  export = momentHijri;
} 