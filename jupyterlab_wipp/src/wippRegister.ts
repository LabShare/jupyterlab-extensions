import { Spinner } from '@jupyterlab/apputils';
import { Widget } from '@phosphor/widgets';
import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

function ApiRequest<T>(
    url: string,
    request: Object | null,
    settings: ServerConnection.ISettings
  ): Promise<T> {
    return ServerConnection.makeRequest(url, request, settings).then(response => {
      if (response.status !== 200) {
        return response.json().then(data => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }
      return response.json();
    });
  }

export class WippRegister extends Widget{
    body: HTMLElement;
    spinner: Spinner;
    path: string;
    name: string;
    description: string;
    openInWipp: boolean;

    /**
   * Instantiates the dialog and makes call to WIPP API.
   */
    constructor(
        path: string,
        name: string,
        description: string,
        openInWipp: boolean
    ) {
        super();

        // Copy variables
        this.path = path;
        this.name = name;
        this.description = description;
        this.openInWipp = openInWipp;

        // Create dialog body
        this.body = this.createBody();
        this.node.appendChild(this.body);

        // Add spinner to show while requesting API
        this.spinner = new Spinner();
        this.node.appendChild(this.spinner.node);

        // Make API request
        this.registerNotebook();
    }
    
    /**
     * Executes the backend service API to register notebook in WIPP and handles response and errors.
     */
    private registerNotebook() {
        // Make request to Jupyter API
        const settings = ServerConnection.makeSettings();
        const requestUrl = URLExt.join(settings.baseUrl, '/wipp/register');

        // Make request to the backend API
        var request = {
            path: this.path,
            name: this.name,
            description: this.description
        };
        var fullRequest = {
            method: 'POST',
            body: JSON.stringify(request)
        };

        ApiRequest<any>(requestUrl, fullRequest, settings)
        .then(response => {
            this.handleResponse(response);
          })
          .catch(() => this.handleError());
    }

    private handleResponse(response: any) {
        // Remove spinner from dialog
        this.node.removeChild(this.spinner.node);
        this.spinner.dispose();

        // Print the response for debug
        console.log(response);

        // Throw exception for API error
        if (response.code !== 200) {
            this.handleError(response.error);
        }
        else {
            this.handleSuccess();
        }

        const info = response.info;

        // Open registered notebook in WIPP
        if (this.openInWipp) {
            window.open(info.url + info.id, '_blank');
        }
        
    }

    private handleSuccess() {
        const label = document.createElement('label');
        const text = document.createElement('span');
        text.textContent = `Notebook '${this.name}' successfully registered in WIPP`;
        label.appendChild(text);
        this.body.appendChild(label);
    }

    private handleError(
        message: string = 'Unexpected failure. Please check your Jupyter server logs for more details.'
    ) {
        const label = document.createElement('label');
        const text = document.createElement('span');
        text.textContent = `Notebook '${this.name}' registering in WIPP failed with error:`;
        const errorMessage = document.createElement('span');
        errorMessage.textContent = message;
        errorMessage.setAttribute(
        'style',
        'background-color:var(--jp-rendermime-error-background)'
        );
        label.appendChild(text);
        label.appendChild(document.createElement('p'));
        label.appendChild(errorMessage);
        this.body.appendChild(label);
    }

    private createBody(): HTMLElement {
        const node = document.createElement('div');
        node.className = 'jp-RedirectForm';
        return node;
      }
}