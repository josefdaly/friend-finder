require 'sinatra'
require 'sinatra-websocket'
require 'json'

class FindFriends < Sinatra::Application

  set :server, 'thin'
  set :sockets, {}

  get '/:path' do
    path = params[:path]

    if !request.websocket?
      erb :map_page
    else
      request.websocket do |ws|

        ws.onopen do
          if settings.sockets[path]
            settings.sockets[path].push(ws)
          else
            settings.sockets[path] = [ws]
          end
        end

        ws.onclose do
          warn('websocket closed')
          settings.sockets[path].delete(ws)
          if settings.sockets[path].length < 1
            settings.sockets.delete(path)
          end
        end

        ws.onmessage do |msg|
          EM.next_tick {
            msg = JSON.parse(msg)
            if msg['type'] == 'location-update'
              settings.sockets[path].each do |s|
                s.send(msg.to_json)
              end
            end
          }
        end
      end
    end
  end
end
