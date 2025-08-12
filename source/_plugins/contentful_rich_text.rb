require 'rich_text_renderer'
require_relative './ui_template.rb'
require 'byebug'
class EmbeddedInlineEntryRenderer < RichTextRenderer::BaseNodeRenderer
  include UITemplate

  def render(node)
    entry = node['data']['target']
    case entry['sys']['content_type_id']
      when 'footnote'
        footnote_id = entry['sys']['id'] 
        create_footnote_html(footnote_id)
      else
        puts "Can't render embedded entry"
    end
  end
end

class CreateFootnotesPanel < RichTextRenderer::BaseNodeRenderer
  include UITemplate

  def render(node)
    entry = node['data']['target']

    case entry['sys']['content_type_id']
      when 'footnote'
        footnote_id = entry['sys']['id']
        footnote_body = entry['body']
        create_footnotes_panel(footnote_body, footnote_id)
      else
        puts "Can't render embedded entry"
    end
  end
end

class EmbeddedEntryRenderer < RichTextRenderer::BaseNodeRenderer
  include UITemplate

  def render(node)
    entry = node['data']['target']
    case entry['sys']['content_type_id']
      when 'figure'
        @@figures = Psych.load_file('./source/_data/contentful/figure.yaml', permitted_classes: [DateTime, Time])
        @@figures['figure'].map! {|figure| { image_id: figure['image']['sys']['id'], url: figure['image']['url'], description: figure['image']['description']} }

        image = @@figures['figure'].find { |fig| fig[:image_id] == entry['image']['sys']['id'] }
        title = entry['title'] || ''
        caption = entry['caption'] || ''
        image_url = image[:url] || 'No image available'
        image_description = image[:description] || entry['caption']
        figure_id = entry['sys']['id']
        create_figure_html(figure_id, title, image_url, image_description, caption)
      when 'table'
        title = entry['title']
        body = entry['body']
        caption = entry['caption']
        create_table(title, body, caption)
      when 'pullQuote'
        content = entry['pull_quote'] || ''
        attribution = entry['attribution'] || ''
        create_quote_html(content, attribution)
      when 'boxContent'
        title = entry['title'] || 'No title available'
        content = entry['body'] || 'No content available'
        if entry['image']
          image_url = entry['image']['url']
          alt_text = entry['image']['description']
        else
          image_url = 'No image available'
          alt_text = 'No alt text available'
        end
        create_box_html(title, image_url, alt_text, content)
      when 'iframeContent'
        title = entry['title']
        body = entry['embed_code'] || ''
        caption = entry['caption'] || ''
        create_iframe_html(body, caption)
      when 'codeContent'
        title = entry['title']
        body = entry['code'] || ''
        caption = entry['caption'] || ''
        create_code_html(title, body, caption)
      when 'chart'
        chart_id = entry['sys']['id']
        chart_title = entry['title']
        chart_caption = RichTextRenderer::Renderer.new().render(entry['caption'])
        chart_type = entry['chart_type']
        chart_markdown = entry['markdown_table']
        chart_data_table_unit = entry['data_table_unit']
        create_chart_body(chart_id, chart_title, chart_caption, chart_type, chart_markdown, chart_data_table_unit)
      else
        puts "Can't render embedded entry"
    end
  end
end




class EmbeddedAssetRenderer < RichTextRenderer::BaseNodeRenderer
  def render(node)
    entry = node['data']['target']
    "<img id=#{entry['title']} class=\"figure__image\" src=#{entry['url']} alt=\"#{entry['description']}\" />"
  end
end

class SilentNullRenderer < RichTextRenderer::BaseNodeRenderer
  def render(node)
    ""
  end
end

class HeadingRenderer < RichTextRenderer::BaseNodeRenderer
  include Jekyll::Filters
  
  def render(node)
    map_header_tag = {
      'heading-2' => 'h2', 
      'heading-3' => 'h3', 
      'heading-4' => 'h4', 
    }
    heading_type = node['nodeType']
    header_tag = map_header_tag[heading_type]
    heading_value = node['content'][0]['value']
    "<#{header_tag} class=\"heading\" id=#{slugify(heading_value)}>#{heading_value}</#{header_tag}>"
  end
end

module Jekyll
  module DataFormatter
    def rich_text_to_html(content)
      renderer = RichTextRenderer::Renderer.new(
        nil => SilentNullRenderer, 
        'embedded-entry-inline' => EmbeddedInlineEntryRenderer, 
        'embedded-entry-block' => EmbeddedEntryRenderer,
        'embedded-asset-block' => EmbeddedAssetRenderer,
        'heading-2' => HeadingRenderer,
        'heading-3' => HeadingRenderer,
        'heading-4' => HeadingRenderer,
        )
      renderer.render(content)
    end

    def extract_footnotes_from_rich_text(content)
      renderer = RichTextRenderer::Renderer.new(
        nil => SilentNullRenderer, 
        'text' => SilentNullRenderer,
        'embedded-entry-block' => SilentNullRenderer,
        'embedded-entry-inline' => CreateFootnotesPanel,
        'embedded-asset-block' => SilentNullRenderer,
        )
      renderer.render(content)
    end
  end
end

Liquid::Template.register_filter(Jekyll::DataFormatter)