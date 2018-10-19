const GroupList = [];
const Group = class {

  static get list() {
    return GroupList;
  }

  static get(name) {
    if(!Group.has(name)) {
      return new Group(name);
    }

    return GroupList.find(group => group.name === name);
  }

  static has(name) {
    return GroupList.find(group => group.name === name) !== undefined;
  }

  constructor(name) {
    this.name = name;

    GroupList.push(this);
  }

  is(name) {
    return this.name.toLowerCase() === name.toLowerCase();
  }
};

App.register('Group', Group);
