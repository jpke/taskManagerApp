import fetch from 'isomorphic-fetch';
import * as types from '../constants/actionTypes';

const url = types.url;

export function loading() {
  return {
    type: types.LOADING
  };
}

export function badResponse(errorMessage) {
  return {
    type: types.UPDATE_ERROR,
    message: errorMessage
  }
}

export function toggleView() {
  return {
    type: types.TOGGLE_VIEW
  }
}

//toggle between task list and user list
export function toggleTaskUser() {
  return {
    type: types.TOGGLE_TASK_USER_VIEW
  }
}

export function toggleUserView() {
  return {
    type: types.TOGGLE_USER_VIEW
  }
}

//dispatches user info to reducer; called upon successful registration or login
function loggedIn(response) {
  return {
    type: types.LOG_IN,
    userName: response.name,
    userId: response._id,
    profilePicSet: response.profilePicSet,
    token: response.token
  };
}

//dispatches logout action to reducer
export function logOut() {
  return {
    type: types.LOG_OUT
  };
}

//toggles profilePicSet to reveal or hide user profile pic
export function unsetProfilePic() {
  console.log("action triggered")
  return {
    type: types.PROFILE_PIC_TOGGLE_SET
  };
}

//sends async request to register new user
//calls loggedIn upon success
//calls badReponse upon failure
export function register(userName, email, password) {
  return function (dispatch) {
    dispatch(loading('register'));
    console.log("to send: ", userName, email, password)
    try {
      fetch(url.concat('users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: userName,
          email: email,
          password: password
        })
      })
      .then(response => {
        if(response.status !=201) throw response;
        return response.json()
      })
      .then(response => {
        dispatch(loading(''));
        dispatch(loggedIn(response));
      })
    } catch(error) {
      if(error.status === 400) {
        //provides more specific error message
        return dispatch(badResponse("Email already in use"));
      }
      console.log("error response: ", error);
      dispatch(badResponse("Problem with registration"))
    }
  };
}

//sends async request to authenticate user
//dispatches new json web token upon success
//calls badResponse upon failure
export function logIn(email, password) {
  return function (dispatch) {
    dispatch(loading('logIn'));

      fetch(url.concat('login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        withCredentials: true,
        body: JSON.stringify({
          email: email,
          password: password
        })
      })
      .then(response => {
        if(response.status != 200) {
          throw response;
        }
        return response.json()
      })
      .then(response => {
        dispatch(loading(''));
        dispatch(loggedIn(response));
      })
      .catch((response) => {
        dispatch(loading(''));
        if(response.status === 400) {
          //provides more specific info in alert message
          return dispatch(badResponse("Incorrect Password"));
        }
      dispatch(badResponse("Problem with login"))
      console.log("error response: ", response);
    })
  };
}

export function editFilterBy(filterWhos, filterType, date) {
  let dateCache = typeof(date);
  console.log("filter by: ", filterType, dateCache, date);
  return {
    type: types.FILTER_BY,
    filterWhos,
    date,
    filterType
  };
}

export function createTask(ID = "new") {
  return {
    type: types.CREATE_NEW_TASK,
    ID
  };
}

export function updateNewTask(key, value, ID) {
  return {
    type: types.UPDATE_NEW_TASK,
    key,
    value,
    ID
  };
}

export function deleteTask(taskID, token) {
  return function(dispatch) {
    dispatch(loading());
    fetch(url.concat("task/", taskID), {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      dispatch(loading());
      if(response.status !== 200) throw response;
      dispatch({
        type: types.DELETE_TASK,
        taskID
      })
    })
    .catch(() => {
      dispatch(badResponse("Delete task error"));
    })
  }
}

export function submitTask(task, userId, userName, profilePicSet, token) {
  console.log("token: ", token);
  let newTask = JSON.parse(JSON.stringify(task));
  newTask.createdBy = {
    _id: userId,
    name: userName,
    profilePicSet: profilePicSet
  };
  return function(dispatch) {
    dispatch(loading());
    if(!newTask._id){
      fetch(url.concat("task"), {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      })
      .then(response => {
        dispatch(loading());
        if(response.status !== 201) throw response;
        return response.json()
      })
      .then(response => {
        dispatch({
          type: types.ADD_TASK,
          task: response
        })
      })
      .catch(() => {
        dispatch(badResponse("Create new task "));
      })
    }
    else {
      fetch(url.concat("task"), {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      })
      .then(response => {
        dispatch(loading());
        if(response.status !== 200) {throw response;}
        return response.json()
      })
      .then(response => {
        dispatch({
          type: types.UPDATE_TASK,
          task: response
        })
      })
      .catch((err) => {
        console.log("error: ", err);
        dispatch(badResponse("Task update "));
      })
    }
  }
}

export function getTasks(filterByType = "all", filterBy = "1", whose = "mine", token) {
  return function(dispatch) {
    if(filterBy != 1 || filterBy != "1") {
      filterBy = new Date(filterBy).getTime() + (new Date().getTimezoneOffset() * 1000 * 60)
    }
    dispatch(loading());
    fetch(url.concat(`task/${filterByType}/${filterBy}/${whose}`), {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      dispatch(loading());
      // console.log("response status: ", response.status, response.status !== 200)
      if(response.status !== 200) throw response;
      return response.json()
    })
    .then(response => {
      dispatch({
        type: types.UPDATE_TASKS,
        tasks: response
      })
    })
    .catch(() => {
      dispatch(badResponse("Problem fetching tasks"));
    })
  }
}

export function getUsers(token) {
  return function(dispatch) {
    dispatch(loading());
    fetch(url.concat('users'), {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      dispatch(loading());
      // console.log("response status: ", response.status, response.status !== 200)
      if(response.status !== 200) throw response;
      return response.json()
    })
    .then(response => {
      dispatch({
        type: types.UPDATE_USERS,
        users: response
      })
    })
    .catch(() => {
      dispatch(badResponse("Problem fetching users"));
    })
  }
}

export function viewUser(user, token) {
  return function(dispatch) {
    dispatch(loading());
    fetch(url.concat(`users/${user._id}`), {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      dispatch(loading());
      console.log("response status: ", response.status, response.status !== 200)
      if(response.status !== 200) throw response;
      return response.json()
    })
    .then(response => {
      dispatch({
        type: types.UPDATE_SELECTED_USER,
        tasks: response,
        selectedUser: user
      })
      dispatch(toggleUserView());
    })
    .catch((err) => {
      console.log("error: ", err);
      dispatch(badResponse("Problem fetching tasks"));
    })
  }
}

export function newProfilePic(newProfilePic) {
  return {
    type: types.NEW_PROFILE_PIC,
    newProfilePic
  }
}

export function uploadProfileImage(file, token) {
  return function(dispatch) {
    dispatch(loading("uploading profile image"));
      let formData = new FormData();
      formData.append("file", file);
      fetch(url.concat('profileImage'), {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      .then(response => {
        if(response.status != 201) throw response;
        return response.json();
      })
      .then(() => {
        return dispatch({
          type: types.UPDATE_PROFILE_PIC
        });
      })
      .catch(error => {
        dispatch(badResponse("Problem with uploading file"))
        console.log("error response: ", error);
      })
  }
}
