import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

import * as buffer from "buffer";
window.Buffer = buffer.Buffer;

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);