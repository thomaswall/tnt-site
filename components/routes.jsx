import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Redirect, browserHistory } from 'react-router';

import Root from 'root'
import Viz from 'viz';

ReactDOM.render((
	<Router history={browserHistory}>
		<Route component={Root}>
			<Route path='/' component={Viz} />
		</Route>
	</Router>
), document.getElementById('root'));
