![Version](https://img.shields.io/npm/v/@swarmjs/crud) ![Downloads](https://img.shields.io/npm/dm/@swarmjs/crud) ![License](https://img.shields.io/github/license/swarm-js/crud) ![Build](https://img.shields.io/github/actions/workflow/status/swarm-js/crud/build.yml?branch=main)
<br/>

<p align="center">
  <a href="https://github.com/swarm-js/crud">
    <img src="images/logo.png" alt="Logo" width="120" height="120">
  </a>

  <h3 align="center">@swarmjs/crud</h3>

  <p align="center">
    CRUD handler for Mongoose models.
    <br/>
    <br/>
  </p>
</p>

## Table Of Contents

- [About the Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Crudors](#crudors)
- [Acknowledgements](#acknowledgements)

## About The Project

This package aims to help developers quickly create CRUD controllers.

## Built With

- TypeScript@4

## Getting Started

### Installation

```sh
yarn add @swarmjs/crud
```

or

```sh
npm install --save @swarmjs/crud
```

## Usage

```ts
import { Crud } from '@swarmjs/crud'
import User from './models/User'

const crud = new Crud(User)

const userSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email'
    },
    name: {
      type: 'string'
    }
  }
}

export default class UsersController {
  @Returns(200, crud.getListSchema(userSchema), 'The users list')
  static list(request, reply) {
    crud.list(request, reply, {
      defaultLimit: 20,
      filter: null, // You can use a MongoDB query
      defaultSort: '_id'
    })
  }

  @Returns(201, { type: 'object' }, 'Document created')
  static create(request, reply) {
    crud.create(request, reply)
  }

  @Returns(200, userSchema, 'The searched user')
  static get(request, reply) {
    crud.get(request, reply, {
      idParam: 'id', // The params field where is the searched document ID
      primaryKey: '_id' // The primary key in the mongoose model where we search the value passed in params
    })
  }

  @Returns(200, { type: 'object' }, 'Update successful')
  @Returns(404, { type: 'object' }, 'Document not found')
  static update(request, reply) {
    crud.update(request, reply, {
      idParam: 'id', // The params field where is the searched document ID
      primaryKey: '_id' // The primary key in the mongoose model where we search the value passed in params
    })
  }

  @Returns(200, { type: 'object' }, 'Update successful')
  @Returns(201, { type: 'object' }, 'Document created')
  static replace(request, reply) {
    crud.replace(request, reply, {
      idParam: 'id', // The params field where is the searched document ID
      primaryKey: '_id' // The primary key in the mongoose model where we search the value passed in params
    })
  }

  @Returns(204, { type: 'object' }, 'Delete successful')
  @Returns(404, { type: 'object' }, 'Document not found')
  static delete(request, reply) {
    crud.delete(request, reply, {
      idParam: 'id', // The params field where is the searched document ID
      primaryKey: '_id' // The primary key in the mongoose model where we search the value passed in params
    })
  }
}
```

## Roadmap

See the [open issues](https://github.com/swarm-js/crud/issues) for a list of proposed features (and known issues).

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

- If you have suggestions for adding or removing projects, feel free to [open an issue](https://github.com/swarm-js/crud/issues/new) to discuss it, or directly create a pull request after you edit the _README.md_ file with necessary changes.
- Please make sure you check your spelling and grammar.
- Create individual PR for each suggestion.
- Please also read through the [Code Of Conduct](https://github.com/swarm-js/crud/blob/main/CODE_OF_CONDUCT.md) before posting your first idea as well.

### Creating A Pull Request

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See [LICENSE](https://github.com/swarm-js/crud/blob/main/LICENSE.md) for more information.

## Crudors

- [Guillaume Gagnaire](https://github.com/guillaume-gagnaire)
